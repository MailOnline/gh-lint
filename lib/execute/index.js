'use strict';

const path = require('path');
const github = require('./github');
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});
const co = require('co');

const execute = module.exports = {
  checkRules (config, options) {
    return co(function *() {
      const repoSourceRules = yield execute.prepareRepoRules(config, options);
      return yield execute.checkPreparedRules(repoSourceRules, options);
    });
  },

  *checkPreparedRules (repoSourceRules, options) {
    const results = {};
    for (const repoOrg in repoSourceRules) {
      const repoResults = results[repoOrg] = {};
      const repoSources = repoSourceRules[repoOrg];
      for (const source in repoSources) {
        const sourceRules = repoSources[source];
        const sourceData = yield github.getSource[source](repoOrg, options);
        for (const ruleName in sourceRules) {
          const ruleConfigs = sourceRules[ruleName];
          repoResults[ruleName] = checkRule(ruleName, ruleConfigs, sourceData);
        }
      }
    }
    return results;
  },

  *prepareRepoRules (config, options) {
    /* eslint require-yield: 0 */
    const repoSourceRules = {};
    const {org, rules, organizations, teams, repositories} = config;

    if (rules) {
      // global rules
      const repos = yield github.getRepos.organization(org, options);
      addRepos(repos, rules);
    }

    if (organizations) {
      // organization-specific rules
      for (const orgName in organizations) {
        const repos = yield github.getRepos.organization(orgName, options);
        addRepos(repos, organizations[orgName].rules);
      }
    }

    if (teams) {
      // team specific rules
      for (const teamName in teams) {
        let [orgName, shortTeamName] = teamName.split('/');
        if (!orgName) {
          orgName = org;
          shortTeamName = teamName;
        }
        const repos = yield github.getRepos.team(orgName, shortTeamName, options);
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
      for (let repo of repos) addRepoRules(repo.full_name, repoRules);
    }

    function addRepoRules(fullRepoName, repoRules) {
      const repoSources = repoSourceRules[fullRepoName] = repoSourceRules[fullRepoName] || {};
      for (const ruleName in repoRules) {
        const ruleOptions = execute.normaliseRuleOptions(repoRules[ruleName]);
        const ruleDefinition = getRuleDefinition(ruleName);
        const source = ruleDefinition.source;
        const sourceRules = repoSources[source] = repoSources[source] || {};
        sourceRules[ruleName] = sourceRules[ruleName] || [];
        sourceRules[ruleName].push(ruleOptions);
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
        for (let item of options) {
          switch (typeof item) {
            case 'string': opts[item] = true; break;
            case 'object': copy(item, opts); break;
          }
        }
        return opts;
      }
    }
  }
};


function checkRule(ruleName, ruleConfigs, sourceData) {
  const ruleDefinition = getRuleDefinition(ruleName);
  if (typeof ruleDefinition.check != 'function') {
    const schema = ruleDefinition.check;
    ruleDefinition.check = createCheckFunction(ruleName, schema);
  }
  const results = [];
  for (const ruleCfg of ruleConfigs) {
    const result = ruleDefinition.check(ruleCfg, sourceData);
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


function getRuleDefinition(ruleName) {
  return require(path.join('..', 'rules', ruleName));
}


function copy(o, to) {
  to = to || {};
  for (const key in o) to[key] = o[key];
  return to;
}

