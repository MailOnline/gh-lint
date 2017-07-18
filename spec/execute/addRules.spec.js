'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');

const TEST_RULE = {
  meta: {
    name: 'my-rule',
    description: 'Test rule',
    category: 'Test'
  },
  schema: {},
  source: 'meta',
  check: {
    type: 'object',
    required: ['description'],
    properties: {
      description: {
        type: 'string',
        minLength: 15
      }
    }
  }
};


describe('addRules', () => {
  it('should only allow adding the same rule once', () => {
    execute.addRules({ 'my-rule': TEST_RULE });
    assert.throws(() => {
      execute.addRules({ 'my-rule': TEST_RULE });
    }, /already defined/);
  });

  it('should throw if rule name in definition is different', () => {
    assert.throws(() => {
      execute.addRules({ 'another-rule': TEST_RULE });
    }, /different name/);
  });
});
