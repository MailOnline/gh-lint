'use strict';

module.exports = {
  meta: {
    name: 'repo-description',
    description: 'check that repo has description specified in GitHub UI',
    category: 'Repo',
    recommended: true
  },

  schema: {
    type: 'object',
    properties: {
      minLength: {
        type: 'integer',
        minimum: 0,
        default: 1
      }
    }
  },

  source: 'meta',

  check: {
    type: 'object',
    required: ['description'],
    properties: {
      description: {
        type: 'string',
        minLength: 10 // TODO { $param: '/minLength' }
      }
    }
  },

  issue: {
    title: 'Add repo description',
    comments: {
      update: 'Please add repo description',
      close: 'Repo description added, closing',
      reopen: 'No repo description, probably removed. Please add it'
    }
  }
};
