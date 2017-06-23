'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');


describe('prepareConfig', () => {
  it('should throw exception if config is not valid', () => {
    assert.throws(() => {
      execute.prepareConfig({});
    }, /config is invalid/);
  });

  it('should throw exception if rule does not exist', () => {
    assert.throws(() => {
      execute.prepareConfig({
        org: 'MailOnline',
        rules: {
          'some-unknown-rule': 2
        }
      });
    }, /cannot find rule/);
  });

  it('should throw exception if rule options are invalid', () => {
    assert.throws(() => {
      execute.prepareConfig({
        org: 'MailOnline',
        repositories: {
          'milojs/milo': {
            rules: {
              'commit-name': [2, {
                maxLineLength: 'invalid'
              }]
            }
          }
        }
      });
    }, /config for rule.*commit-name.*milojs\/milo.*invalid/);
  });
});
