'use strict';

const path = require('path');
const glob = require('glob');
const github = require('./github');
const Ajv = require('ajv');
const ajv = new Ajv({
  allErrors: true,
  useDefaults: true,
  schemas: {
    defs: require('../../schemas/defs.json'),
    rule: require('../../schemas/rule.json'),
    config: require('../../schemas/config.json'),
    plugin: require('../../schemas/plugin.json')
  }
});
require('ajv-keywords')(ajv, ['typeof', 'patternRequired']);

const RULES = {}, PLUGINS = {};
const PLUGIN_PREFIX = 'ghlint-plugin-';
let CORE_LOADED = false;
const MS_PER_DAY = 86400000;


const execute = module.exports = {
  async checkRules (config, options={}) {
    config = execute.prepareConfig(config);
    options = prepareOptions(options);
    github.setOptions(options);
    const repoSourceRules = await execute.prepareRepoRules(config, options);
    return execute.checkPreparedRules(repoSourceRules);
  },

  async checkPreparedRules (repoSourceRules) {
    const results = {};
    for (const orgRepo in repoSourceRules) {
      const repoResults = results[orgRepo] = {};
      const repoSources = repoSourceRules[orgRepo];
      for (const source in repoSources) {
        const sourceRules = repoSources[source];
        const sourceData = await github.getSource[source](orgRepo);
        for (const ruleName in sourceRules) {
          const ruleConfig = sourceRules[ruleName];
          repoResults[ruleName] = await checkRule(orgRepo, ruleName, ruleConfig, sourceData);
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
        const repos = await github.getRepos.team(orgName, shortTeamName, options.teamAccess);
        addRepos(repos, teams[teamName].rules);
      }
    }

    function addRepositories() {
      const repositories = config.repositories;
      if (!repositories) return;
      for (const repoNamesList in repositories) {
        const repoNamesArr = repoNamesList.split(/\s*,\s*/);
        const repoRules = repositories[repoNamesList].rules;
        for (const repoName of repoNamesArr) {
          const fullRepoName = /\//.test(repoName) ? repoName : org + '/' + repoName;
          addRepoRules(fullRepoName, repoRules);
        }
      }
    }

    function removeDisabledRules() {
      for (const orgRepo in repoSourceRules) {
        const repoSources = repoSourceRules[orgRepo];
        for (const source in repoSources) {
          if (Object.keys(repoSources[source]).length == 0)
            delete repoSources[source];
        }
        if (Object.keys(repoSources).length == 0)
          delete repoSourceRules[orgRepo];
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

        if (ruleOptions.mode === 0)
          delete sourceRules[ruleName];
        else
          sourceRules[ruleName] = ruleOptions;
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
    if (ruleName in RULES) return RULES[ruleName];
    throw new Error(`rule "${ruleName}" is not defined`);
  },

  prepareConfig(config) {
    if (!CORE_LOADED) execute.initialize();
    if (config.plugins) loadPlugins(config);
    config = JSON.parse(JSON.stringify(config));
    callValidate(ajv.getSchema('config'), config, 'config');

    const {organizations, teams, repositories} = config;
    const validateRule = {};
    useRules(config, 'global rules');
    useRulesFromMap(organizations, 'organization');
    useRulesFromMap(teams, 'team');
    useRulesFromMap(repositories, 'repository');

    return config;


    function useRules({rules}={}, scope) {
      if (rules) {
        for (const name in rules) {
          rules[name] = execute.normaliseRuleOptions(rules[name]);
          if (!validateRule[name]) {
            const ruleSchema = execute.getRuleDefinition(name).schema;
            validateRule[name] = ajv.compile(ruleSchema);
          }
          callValidate(validateRule[name], rules[name], `config for rule "${name}" in ${scope}`);
        }
      }
    }

    function useRulesFromMap(group, groupName) {
      if (group) {
        for (const item in group)
          useRules(group[item], `${groupName} "${item}"`);
      }
    }
  },

  initialize() {
    if (!CORE_LOADED) loadCoreRules();
  },

  addRules(rules, skipValidation) {
    const validate = ajv.getSchema('rule');
    for (const name in rules) {
      if (name in RULES)
        throw new Error(`rule "${name}" is already defined`);
      const rule = rules[name];
      if (name != rule.meta.name)
        throw new Error(`rule "${name}" has different name in the definition: "${rule.meta.name}"`);
      if (!skipValidation) callValidate(validate, rule, `rule "${name}"`);
      RULES[name] = rule;
    }
  },

  dateDaysAgo(days) {
    let ts = Date.now() - days * MS_PER_DAY;
    return new Date(ts - ts % MS_PER_DAY);
  }
};


function loadCoreRules() {
  CORE_LOADED = true;
  const ruleFiles = glob.sync('../rules/*.js', {cwd: __dirname});
  const coreRules = {};
  for (const ruleFile of ruleFiles) {
    const rule = require(ruleFile);
    const name = path.basename(ruleFile, path.extname(ruleFile));
    coreRules[name] = rule;
  }
  execute.addRules(coreRules);
}


function loadPlugins(config) {
  const validate = ajv.getSchema('plugin');
  for (let name of config.plugins) {
    if (name.indexOf(PLUGIN_PREFIX) == -1)
      name = PLUGIN_PREFIX + name;
    if (name in PLUGINS) continue;
    const plugin = require(name);
    callValidate(validate, plugin, `plugin "${name}"`);
    execute.addRules(plugin.rules, true);
    PLUGINS[name] = true;
  }
}


function prepareOptions(options) {
  options = copy(options);
  const {after, before, teamAccess} = options;
  if (after) options.after = getRangeDate(after, 'after');
  if (before) options.before = getRangeDate(before, 'before');
  if (options.commits === undefined) {
    options.commits = {since: execute.dateDaysAgo(30)};
  } else {
    options.commits = copy(options.commits);
    const {since, until} = options.commits;
    if (since) options.commits.since = getRangeDate(since, 'commits.since');
    if (until) options.commits.until = getRangeDate(until, 'commits.until');
  }
  if (!teamAccess) options.teamAccess = 'admin';
  return options;
}


function getRangeDate(param, name) {
  switch (typeof param) {
    case 'string':
      return param;
    case 'number':
      return execute.dateDaysAgo(param);
    default:
      if (param instanceof Date) return param;
      throw new Error(`incorrect "${name}" option type: ${param.toString()}`);
  }
}


function callValidate(validate, data, title) {
  if (!validate(data))
    throw new Error(`${title} is invalid: ${ajv.errorsText(validate.errors)}`);
}


async function checkRule(orgRepo, ruleName, ruleConfig, sourceData) {
  const ruleDefinition = execute.getRuleDefinition(ruleName);
  if (typeof ruleDefinition.check != 'function') {
    const schema = ruleDefinition.check;
    ruleDefinition.check = createCheckFunction(ruleName, schema);
  }
  const result = await ruleDefinition.check(ruleConfig, sourceData, orgRepo, github);
  if (!result.valid) result.mode = ruleConfig.mode;
  return result;
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
