'use strict';

module.exports = {
  meta: {
    name: 'repo-homepage',
    description: 'check that repo has homepage specified in GitHub UI',
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
    required: ['homepage'],
    properties: {
      homepage: {
        type: 'string',
        minLength: 10 // TODO { $param: '/minLength' }
      }
    }
  },

  issue: {
    title: 'Add repo homepage',
    comments: {
      update: 'Please add repo homepage',
      close: 'Repo homepage added, closing',
      reopen: 'No repo homepage, probably removed. Please add it'
    }
  }
};
