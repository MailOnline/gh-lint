'use strict';

const path = require('path');
const github = require('./github');
const Ajv = require('ajv');
const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  schemas: {
    defs: require('../../schemas/defs.json'),
    rule: require('../../schemas/rule.json'),
    config: require('../../schemas/config.json')
  }
});


const execute = module.exports = {
  async checkRules (config, options={}) {
    config = execute.prepareConfig(config);
    github.setOptions(options);
    const repoSourceRules = await execute.prepareRepoRules(config, options);
    return execute.checkPreparedRules(repoSourceRules);
  },

  async checkPreparedRules (repoSourceRules) {
    const results = {};
    for (const repoOrg in repoSourceRules) {
      const repoResults = results[repoOrg] = {};
      const repoSources = repoSourceRules[repoOrg];
      for (const source in repoSources) {
        const sourceRules = repoSources[source];
        const sourceData = await github.getSource[source](repoOrg);
        for (const ruleName in sourceRules) {
          const ruleConfigs = sourceRules[ruleName];
          repoResults[ruleName] = await checkRule(ruleName, ruleConfigs, sourceData);
        }
      }
    }
    return results;
  },

  async prepareRepoRules (config, options={}) {
    const repoSourceRules = {};
    const org = config.org;

    await addGlobalRules();
    await addOrganisations();
    await addTeams();
    addRepositories();
    removeDisabledRules();

    return repoSourceRules;

    async function addGlobalRules() {
      if (!config.rules) return;
      const repos = await github.getRepos.organization(org);
      addRepos(repos, config.rules);
    }

    async function addOrganisations() {
      const organizations = config.organizations;
      if (!organizations) return;
      for (const orgName in organizations) {
        const repos = await github.getRepos.organization(orgName);
        addRepos(repos, organizations[orgName].rules);
      }
    }

    async function addTeams() {
      const teams = config.teams;
      if (!teams) return;
      for (const teamName in teams) {
        let [orgName, shortTeamName] = teamName.split('/');
        if (!shortTeamName) {
          orgName = org;
          shortTeamName = teamName;
        }
        const repos = await github.getRepos.team(orgName, shortTeamName);
        addRepos(repos, teams[teamName].rules);
      }
    }

    function addRepositories() {
      if (!config.repositories) return;
      for (const repoName in config.repositories)
        addRepository(repoName);
    }

    function addRepository(repoName) {
      const fullRepoName = /\//.test(repoName) ? repoName : org + '/' + repoName;
      const repoRules = config.repositories[repoName].rules;
      addRepoRules(fullRepoName, repoRules);
    }

    function removeDisabledRules() {
      for (const repoOrg in repoSourceRules) {
        const repoSources = repoSourceRules[repoOrg];
        for (const source in repoSources) {
          if (Object.keys(repoSources[source]).length == 0)
            delete repoSources[source];
        }
        if (Object.keys(repoSources).length == 0)
          delete repoSourceRules[repoOrg];
      }
    }

    function addRepos(repos, repoRules) {
      for (const repo of repos) {
        const updatedAt = new Date(repo.updated_at);
        const pushedAt = new Date(repo.pushed_at);
        const inRange = (!options.after || updatedAt >= options.after || pushedAt >= options.after) &&
                        (!options.before || (updatedAt < options.before && pushedAt < options.before));
        if (inRange) addRepoRules(repo.full_name, repoRules);
      }
    }

    function addRepoRules(fullRepoName, repoRules) {
      const repoSources = repoSourceRules[fullRepoName] = repoSourceRules[fullRepoName] || {};
      for (const ruleName in repoRules) {
        const ruleOptions = repoRules[ruleName];
        const ruleDefinition = execute.getRuleDefinition(ruleName);
        const source = ruleDefinition.source;
        const sourceRules = repoSources[source] = repoSources[source] || {};
        // multiple configs per rule - no longer supported
        // sourceRules[ruleName] = sourceRules[ruleName] || [];
        // sourceRules[ruleName].push(ruleOptions);

        // config for smaller scope overrides config for bigger scope
        if (ruleOptions.mode === 0)
          delete sourceRules[ruleName];
        else
          sourceRules[ruleName] = [ruleOptions];
      }
    }
  },


  normaliseRuleOptions(options) {
    switch (typeof options) {
      case 'number': {
        return { mode: options };
      }
      case 'object': {
        if (!Array.isArray(options)) return options;
        const opts = { mode: options[0] };
        for (const item of options) {
          switch (typeof item) {
            case 'string': opts[item] = true; break;
            case 'object': copy(item, opts); break;
          }
        }
        return opts;
      }
    }
  },

  getRuleDefinition(ruleName) {
    try { return require(path.join('..', 'rules', ruleName)); }
    catch(e) { throw new Error(`cannot find rule ${ruleName}: ${e.message}`); }
  },

  prepareConfig(config) {
    config = JSON.parse(JSON.stringify(config));
    callValidate(ajv.getSchema('config'), config, 'config');

    const validate = ajv.getSchema('rule');
    const {organizations, teams, repositories} = config;
    const ruleNames = {};
    const validateRule = {};
    addRules(config, 'global rules');
    addRulesFromMap(organizations, 'organization');
    addRulesFromMap(teams, 'team');
    addRulesFromMap(repositories, 'repository');
    for (const name in ruleNames) {
      let rule = execute.getRuleDefinition(name);
      callValidate(validate, rule, `rule "${name}"`);
    }

    return config;


    function addRules({rules}={}, scope) {
      if (rules) {
        for (const name in rules) {
          rules[name] = execute.normaliseRuleOptions(rules[name]);
          if (!validateRule[name]) {
            const ruleSchema = execute.getRuleDefinition(name).schema;
            validateRule[name] = ajv.compile(ruleSchema);
          }
          callValidate(validateRule[name], rules[name], `config for rule "${name}" in ${scope}`);
          ruleNames[name] = true;
        }
      }
    }

    function addRulesFromMap(group, groupName) {
      if (group) {
        for (const item in group)
          addRules(group[item], `${groupName} "${item}"`);
      }
    }
  }
};


function callValidate(validate, data, title) {
  if (!validate(data))
    throw new Error(`${title} is invalid: ${ajv.errorsText(validate.errors)}`);
}


async function checkRule(ruleName, ruleConfigs, sourceData) {
  const ruleDefinition = execute.getRuleDefinition(ruleName);
  if (typeof ruleDefinition.check != 'function') {
    const schema = ruleDefinition.check;
    ruleDefinition.check = createCheckFunction(ruleName, schema);
  }
  const results = [];
  for (const ruleCfg of ruleConfigs) {
    const result = await ruleDefinition.check(ruleCfg, sourceData, github);
    if (!result.valid) {
      result.mode = ruleCfg.mode;
      results.push(result);
    }
  }
  return results;
}


function createCheckFunction(ruleName, schema) {
  const validate = ajv.compile(schema);
  return function (ruleCfg, sourceData) {
    const valid = validate(sourceData);
    const result = {valid};
    if (!valid) {
      result.message = 'not satisfied';
      result.errors = ajv.errorsText(validate.errors);
    }
    return result;
  };
}


function copy(o, to) {
  to = to || {};
  for (const key in o) to[key] = o[key];
  return to;
}
