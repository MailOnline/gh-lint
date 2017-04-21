'use strict';

module.exports = {
  meta: {
    name: 'branch-protection',
    description: 'check that master branch is protected',
    category: 'Branch',
    recommended: true
  },

  schema: {},

  source: 'branches',

  check: {
    type: 'array',
    contains: {
      type: 'object',
      required: ['name', 'protected'],
      properties: {
        name: {const: 'master'},
        protected: {const: true}
      }
    }
  },

  issue: {
    title: 'Master branch is not protected',
    comments: {
      create: 'Please enable master protection',
      update: 'Reminder: please enable master protection',
      close: 'Master protection enabled, closing',
      reopen: 'Please enable master protection'
    }
  }
};
