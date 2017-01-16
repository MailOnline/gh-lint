'use strict';

var path = require('path');
var github = require('./github');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});

var execute = module.exports = {
  *checkPreparedRules (preparedRules, options) {
    var results = {};
    for (var repoOrg in preparedRules) {
      var repoResults = results[repoOrg] = {};
      var repoSources = preparedRules[repoOrg];
      for (var source in repoSources) {
        var repoSourceResults = repoResults[source] = {};
        var repoSourceRules = repoSources[source];
        var sourceData = yield github.getSource[source](repoOrg);
        for (var ruleName in repoSourceRules) {
          var ruleConfigs = repoSourceRules[ruleName];
          repoSourceResults[ruleName] = execute.checkRule(ruleName, ruleConfigs, sourceData);
        }
      }
    }
    return results;
  },

  checkRule (ruleName, ruleConfigs, sourceData) {
    var ruleDefinition = getRuleDefinition(ruleName);
    if (typeof ruleDefinition.check != 'function') {
      var schema = ruleDefinition.check;
      ruleDefinition.check = execute.createCheckFunction(ruleName, schema);
    }
    var results = [];
    ruleConfigs.forEach((ruleCfg) => {
      var result = ruleDefinition.check(ruleCfg, sourceData);
      if (!result.valid) {
        result.mode = ruleCfg.mode;
        results.push(result);
      }
    });
    return results;
  },
  
  createCheckFunction (ruleName, schema) {
    var validate = ajv.compile(schema);
    return function (ruleCfg, sourceData) {
      var valid = validate(sourceData);
      var result = {valid};
      if (!valid) {
        result.message = ruleName + ' is not satisfied';
        result.errors = ajv.errorsText(validate.errors);
      }
      return result;
    }
  },

  *prepareRepoRules (config) {
    var repoSourceRules = {};
    var {org, rules, organisations, teams, repositories} = config;

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
      for (var repoName in repositories) {
        var fullRepoName = /\//.test(repoName) ? repoName : org + '/' + repoName;
        var repoRules = repositories[repoName].rules;
        var repoSources = repoSourceRules[fullRepoName] = repoSourceRules[fullRepoName] || {};
        for (var ruleName in repoRules) {
          var ruleOptions = execute.normaliseRuleOptions(repoRules[ruleName]);
          var ruleDefinition = getRuleDefinition(ruleName);
          var source = ruleDefinition.source;
          var sourceRules = repoSources[source] = repoSources[source] || {};
          sourceRules[ruleName] = sourceRules[ruleName] || [];
          sourceRules[ruleName].push(ruleOptions);
        }
      }
    }

    return repoSourceRules;
  },


  normaliseRuleOptions(options) {
    switch (typeof options) {
      case 'number': return { mode: options };
      case 'object':
        if (!Array.isArray(options)) return options;
        var opts = { mode: options[0] };
        for (var i=1; i<options.length; i++) {
          var item = options[i];
          switch (typeof item) {
            case 'string': opts[item] = true; break;
            case 'object': copy(item, opts); break;
          }
        }
        return opts;
    }
  }
};


function getRuleDefinition(ruleName) {
  return require(path.join('..', 'rules', ruleName));
}


function copy(o, to) {
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}

