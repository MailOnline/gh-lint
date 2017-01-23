'use strict';

const path = require('path');
const github = require('./github');
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});
const co = require('co');

const execute = module.exports = {
  checkRules (config, options) {
    return co(function *() {
      const repoSourceRules = yield execute.prepareRepoRules(config);
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

  *prepareRepoRules (config) {
    /* eslint require-yield: 0 */
    const repoSourceRules = {};
    const {org, rules, organisations, teams, repositories} = config;

    if (rules) {
      // global rules
    }

    if (organisations) {
      // organisation-specific rules
    }

    if (teams) {
      // team specific rules
    }

    if (repositories) {
      for (const repoName in repositories) {
        const fullRepoName = /\//.test(repoName) ? repoName : org + '/' + repoName;
        const repoRules = repositories[repoName].rules;
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
    }

    return repoSourceRules;
  },


  normaliseRuleOptions(options) {
    switch (typeof options) {
      case 'number': {
        return { mode: options };
      }
      case 'object': {
        if (!Array.isArray(options)) return options;
        const opts = { mode: options[0] };
        for (let i=1; i<options.length; i++) {
          const item = options[i];
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
  ruleConfigs.forEach((ruleCfg) => {
    const result = ruleDefinition.check(ruleCfg, sourceData);
    if (!result.valid) {
      result.mode = ruleCfg.mode;
      results.push(result);
    }
  });
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

