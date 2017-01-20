'use strict';

var fs = require('fs');
var path = require('path');
var execute = require('../../execute');
var options = require('./options');

module.exports = {
  execute (argv) {
    var config = loadJson(argv.c || argv.config);
    var opts = options.get(argv);
    return execute.checkRules(config, opts).then(logErrors, console.log);
  },
  schema: {
    type: 'object',
    required: ['c'],
    properties: {
      c: { type: 'string' },
      u: { type: 'string' },
      p: { type: 'string' },
      user: { type: 'string' },
      pass: { type: 'string' }
    }
  }
};


function loadJson(fileName){
  var file = path.resolve(process.cwd(), fileName);
  var json;
  try {
    json = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch(err) {
    console.error('error:  ' + err.message);
    process.exit(2);
  }
  return json;
}


function logErrors(results) {
  let hasErrors;
  for (const repoName in results) {
    for (const ruleName in results[repoName]) {
      const ruleResults = results[repoName][ruleName];
      for (let i=0; i<ruleResults.length; i++) {
        let logMethod, resType;
        if (ruleResults[i].mode == 2) {
          logMethod = resType = 'error';
          hasErrors = true;
        } else {
          logMethod = 'warn';
          resType = 'warning';
        }
        console[logMethod](`${resType} ${repoName}: ${ruleName} - ${ruleResults[i].message}`);
      }
    }
  }
  if (hasErrors) throw new Error('errors in repos');
}
