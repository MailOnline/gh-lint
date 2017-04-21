'use strict';

module.exports = {
  meta: {
    name: 'branch-default',
    description: 'check that default branch is master',
    category: 'Branch',
    recommended: true
  },

  schema: {},

  source: 'meta',

  check: {
    type: 'object',
    required: ['default_branch'],
    properties: {
      default_branch: {
        const: 'master'
      }
    }
  },

  issue: {
    title: 'Master is not a default branch',
    comments: {
      create: 'Please make master default branch',
      update: 'Reminder: please make master default branch',
      close: 'Master is a default branch, closing',
      reopen: 'Please make master default branch'
    }
  }
};
