'use strict';

module.exports = {
  meta: {
    name: 'repo-readme',
    description: 'check that repo has README file',
    category: 'Repo',
    recommended: true
  },

  schema: {},

  source: 'readme',

  check: {
    type: 'object',
    required: ['content', 'encoding'],
    properties: {
      content: {type: 'string'},
      encoding: {type: 'string'}
    }
  },

  issue: {
    title: 'No README file',
    comments: {
      create: 'Please create README file in the repo',
      close: 'README file is created',
      reopen: 'Repo does not have README file, probably removed. Please fix it'
    }
  }
};
