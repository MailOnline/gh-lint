'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');


describe('validateConfig', () => {
  it('should throw exception if config is not valid', () => {
    assert.throws(() => {
      execute.validateConfig({});
    }, /config is invalid/);
  });

  it('should throw exception if rule does not exist', () => {
    assert.throws(() => {
      execute.validateConfig({
        org: 'MailOnline',
        rules: {
          'some-unknown-rule': 2
        }
      });
    }, /cannot find rule/);
  });
});
