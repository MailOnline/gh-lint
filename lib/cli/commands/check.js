'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const execute = require('../../execute');
const options = require('./options');

module.exports = {
  execute (argv) {
    const config = loadConfig(argv.c || argv.config);
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
      pass: { type: 'string' },
      a: { $ref: '#/definitions/dateTime' },
      b: { $ref: '#/definitions/dateTime' },
      after: { $ref: '#/definitions/dateTime' },
      before: { $ref: '#/definitions/dateTime' }
    }
  }
};


function loadConfig(fileName){
  const file = path.resolve(process.cwd(), fileName);
  const ext = path.extname(fileName).toLowerCase();
  let cfg;
  try {
    const fileStr = fs.readFileSync(file, 'utf8');
    cfg = ext == '.yml' || ext == '.yaml'
          ? yaml.safeLoad(fileStr)
          : JSON.parse(fileStr);
  } catch(err) {
    console.error('error:  ' + err.message);
    process.exit(2);
  }
  return cfg;
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
