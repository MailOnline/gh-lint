'use strict';

module.exports = {
  meta: {
    name: 'repo-description',
    description: 'check that repo has description specified in GitHub UI',
    category: 'Repo',
    recommended: true
  },

  schema: {
    minLength: {
      type: 'integer',
      minimum: 0,
      default: 1
    }
  },

  source: 'meta',

  check: {
    type: 'object',
    required: ['description'],
    properties: {
      description: {
        type: 'string',
        minLength: 15 // TODO { $param: '/minLength' }
      }
    }
  }
};
