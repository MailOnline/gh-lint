'use strict';

const fs = require('fs');
const path = require('path');
const execute = require('../../execute');
const options = require('./options');

module.exports = {
  execute (argv) {
    const config = loadJson(argv.c || argv.config);
    const opts = options.get(argv);
    return execute.checkRules(config, opts).then(logErrors, console.error);
  },
  schema: {
    type: 'object',
    oneOf: [
      { required: ['c'] },
      { required: ['config'] }
    ],
    properties: {
      c: { type: 'string' },
      config: { type: 'string' },
      u: { type: 'string' },
      p: { type: 'string' },
      user: { type: 'string' },
      pass: { type: 'string' }
    }
  }
};


function loadJson(fileName){
  const file = path.resolve(process.cwd(), fileName);
  let json;
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
      for (const result of ruleResults) {
        let logMethod, resType;
        if (result.mode == 2) {
          logMethod = resType = 'error';
          hasErrors = true;
        } else {
          logMethod = 'warn';
          resType = 'warning';
        }
        console[logMethod](`${resType} ${repoName}: ${ruleName} - ${result.message}`);
      }
    }
  }
  if (hasErrors) throw new Error('errors in repos');
}
