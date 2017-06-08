'use strict';

const path = require('path');
const github = require('./github');
const Ajv = require('ajv');
const ajv = new Ajv({
  allErrors: true,
  schemas: {
    defs: require('../../schemas/defs.json'),
    rule: require('../../schemas/rule.json'),
    config: require('../../schemas/config.json')
  }
});


const execute = module.exports = {
  async checkRules (config, options={}) {
    execute.validateConfig(config);
    const repoSourceRules = await execute.prepareRepoRules(config, options);
    return execute.checkPreparedRules(repoSourceRules, options);
  },

  async checkPreparedRules (repoSourceRules, options={}) {
    const results = {};
    for (const repoOrg in repoSourceRules) {
      const repoResults = results[repoOrg] = {};
      const repoSources = repoSourceRules[repoOrg];
      for (const source in repoSources) {
        const sourceRules = repoSources[source];
        const sourceData = await github.getSource[source](repoOrg, options);
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
    const {org, rules, organizations, teams, repositories} = config;

    if (rules) {
      // global rules
      const repos = await github.getRepos.organization(org, options);
      addRepos(repos, rules);
    }

    if (organizations) {
      // organization-specific rules
      for (const orgName in organizations) {
        const repos = await github.getRepos.organization(orgName, options);
        addRepos(repos, organizations[orgName].rules);
      }
    }

    if (teams) {
      // team specific rules
      for (const teamName in teams) {
        let [orgName, shortTeamName] = teamName.split('/');
        if (!shortTeamName) {
          orgName = org;
          shortTeamName = teamName;
        }
        const repos = await github.getRepos.team(orgName, shortTeamName, options);
        addRepos(repos, teams[teamName].rules);
      }
    }

    if (repositories) {
      for (const repoName in repositories) {
        const fullRepoName = /\//.test(repoName) ? repoName : org + '/' + repoName;
        const repoRules = repositories[repoName].rules;
        addRepoRules(fullRepoName, repoRules);
      }
    }

    return repoSourceRules;


    function addRepos(repos, repoRules) {
      for (const repo of repos) {
        const updatedAt = new Date(repo.updated_at);
        const inRange = (!options.after || updatedAt > options.after) &&
                        (!options.before || updatedAt < options.before);
        if (inRange) addRepoRules(repo.full_name, repoRules);
      }
    }

    function addRepoRules(fullRepoName, repoRules) {
      const repoSources = repoSourceRules[fullRepoName] = repoSourceRules[fullRepoName] || {};
      for (const ruleName in repoRules) {
        const ruleOptions = execute.normaliseRuleOptions(repoRules[ruleName]);
        const ruleDefinition = execute.getRuleDefinition(ruleName);
        const source = ruleDefinition.source;
        const sourceRules = repoSources[source] = repoSources[source] || {};
        // multiple configs per rule - no longer supported
        // sourceRules[ruleName] = sourceRules[ruleName] || [];
        // sourceRules[ruleName].push(ruleOptions);

        // config for smaller scope overrides config for bigger scope
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
    return require(path.join('..', 'rules', ruleName));
  },

  validateConfig(config) {
    callValidate(ajv.getSchema('config'), config, 'config');

    const validate = ajv.getSchema('rule');
    const {organizations, teams, repositories} = config;
    const ruleNames = {};
    addRuleNames(config);
    addRuleNamesFromMap(organizations);
    addRuleNamesFromMap(teams);
    addRuleNamesFromMap(repositories);
    for (const name in ruleNames) {
      let rule;
      try { rule = execute.getRuleDefinition(name); }
      catch(e) { throw new Error(`cannot find rule ${name}: ${e.message}`); }
      callValidate(validate, rule, `rule "${name}"`);
    }


    function addRuleNames({rules}={}) {
      if (rules) {
        for (const name in rules)
          ruleNames[name] = true;
      }
    }

    function addRuleNamesFromMap(group) {
      if (group) {
        for (const item in group)
          addRuleNames(group[item]);
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
    const result = await ruleDefinition.check(ruleCfg, sourceData);
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

