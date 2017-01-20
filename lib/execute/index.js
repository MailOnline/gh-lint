'use strict';

var path = require('path');
var github = require('./github');
var Ajv = require('ajv');
var ajv = new Ajv({allErrors: true});
var co = require('co');

var execute = module.exports = {
  checkRules (config, options) {
    return co(function *() {
      var repoSourceRules = yield execute.prepareRepoRules(config);
      return yield execute.checkPreparedRules(repoSourceRules, options);
    });
  },

  *checkPreparedRules (repoSourceRules, options) {
    var results = {};
    for (var repoOrg in repoSourceRules) {
      var repoResults = results[repoOrg] = {};
      var repoSources = repoSourceRules[repoOrg];
      for (var source in repoSources) {
        var sourceRules = repoSources[source];
        var sourceData = yield github.getSource[source](repoOrg, options);
        for (var ruleName in sourceRules) {
          var ruleConfigs = sourceRules[ruleName];
          repoResults[ruleName] = checkRule(ruleName, ruleConfigs, sourceData);
        }
      }
    }
    return results;
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


function checkRule(ruleName, ruleConfigs, sourceData) {
  var ruleDefinition = getRuleDefinition(ruleName);
  if (typeof ruleDefinition.check != 'function') {
    var schema = ruleDefinition.check;
    ruleDefinition.check = createCheckFunction(ruleName, schema);
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
}


function createCheckFunction(ruleName, schema) {
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
}


function getRuleDefinition(ruleName) {
  return require(path.join('..', 'rules', ruleName));
}


function copy(o, to) {
  to = to || {};
  for (var key in o) to[key] = o[key];
  return to;
}

