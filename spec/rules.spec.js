'use strict';

const Ajv = require('ajv');
const glob = require('glob');
const assert = require('assert');

const ajv = new Ajv({
  allErrors: true,
  verbose: true
});

require('ajv-keywords')(ajv, ['typeof', 'patternRequired']);

describe('rules', () => {
  it('should be valid', () => {
    ajv.addSchema(require('../schemas/defs.json'));
    const validate = ajv.compile(require('../schemas/rule.json'));

    const rules = glob.sync('../lib/rules/*.js', {cwd: __dirname});

    for (const ruleFile of rules) {
      const rule = require(ruleFile);
      const valid = validate(rule);
      if (!valid) console.log(ajv.errorsText(validate.errors));
      assert(valid, 'rule should be valid: ' + ruleFile);
    }
  });
});
