'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const execute = require('../../execute');
const options = require('./options');

module.exports = {
  execute (argv) {
    const config = loadConfig(argv.config);
    const opts = options.get(argv);
    return execute.checkRules(config, opts).then(logErrors(opts), console.error);
  },
  schema: {
    type: 'object',
    required: ['config'],
    properties: {
      config: { type: 'string' },
      user: { type: 'string' },
      pass: { type: 'string' },
      after: { $ref: '#/definitions/dateTimeOrInt' },
      before: { $ref: '#/definitions/dateTimeOrInt' },
      since: { $ref: '#/definitions/dateTimeOrInt' },
      until: { $ref: '#/definitions/dateTimeOrInt' },
      tap: { type: 'boolean' },
      teamAccess: {
        type: 'string',
        enum: ['admin', 'write', 'read'],
        default: 'admin'
      }
    },
    patternProperties: {
      '^(c|u|p|a|b|team-access)$': true
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


function logErrors(opts) {
  return (results) => {
    let hasErrors;
    let count = 0;
    let passed = 0;
    if (opts.tap) console.log('TAP version 13\n');

    for (const repoName in results) {
      for (const ruleName in results[repoName]) {
        const ruleResult = results[repoName][ruleName];
        count++;
        if (opts.tap) {
          if (ruleResult.valid) {
            passed++;
            console.log(
`ok ${count} ${repoName}: ${ruleName}
  ---
  ${tapTestMeta(repoName, ruleName)}`);
          } else {
            console.log(
`not ok ${count} ${repoName}: ${ruleName}
  ---
  message: ${JSON.stringify(ruleResult.message)}${extraMessages(ruleResult)}
  severity: ${ruleResult.mode == 2 ? 'error' : 'warning'}
  ${tapTestMeta(repoName, ruleName)}`);
          }
        } else {
          if (ruleResult.valid) {
            passed++;
          } else {
            let logMethod, resType;
            if (ruleResult.mode == 2) {
              logMethod = resType = 'error';
              hasErrors = true;
            } else {
              logMethod = 'warn';
              resType = 'warning';
            }
            console[logMethod](`${resType} ${repoName}: ${ruleName} - ${ruleResult.message}`);
          }
        }
      }
    }

    if (opts.tap) {
      console.log(
`\n1..${count}
# tests ${count}
# pass ${passed}

# ${count > passed ? 'not ok' : 'ok'}`);
    } else {
      console.log(`passed ${passed} out of ${count}`);
    }

    if (hasErrors) throw new Error('errors in repos');
  };
}


function tapTestMeta(repoName, ruleName) {
  const ruleDefinition = execute.getRuleDefinition(ruleName);
  return `repo: ${repoName}
  rule: ${ruleName}
  issue:
    ${yaml.safeDump(ruleDefinition.issue).replace(/\n/g, '\n    ')}
  ...`;
}


function extraMessages(result) {
  return result.messages && result.messages.length
          ? '\n  messages: ' + JSON.stringify(result.messages)
          : '';
}
