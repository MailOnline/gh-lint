'use strict';

var co = require('co');
var execute = require('../../lib/execute');
// var util = require('util');
var assert = require('assert');

describe('prepareRepoRules', () => {
  describe('repositories scope', () => {
    it('should collect sources and rules for all repositories', () => {
      var config = {
        org: 'MailOnline',
        repositories: {
          'mol-fe': {
            rules: {
              'repo-description': 2
            }
          },
          'milojs/milo': {
            rules: {
              'repo-description': [2, {minLength: 16}],
              'repo-homepage': 1
            }
          }
        }
      };

      return co(execute.prepareRepoRules(config))
      .then((repoSourceRules) => {
        assert.deepStrictEqual(repoSourceRules, {
          'MailOnline/mol-fe': {
            meta: { 'repo-description': [{ mode: 2}] } },
          'milojs/milo': {
            meta: {
              'repo-description': [{ mode: 2, minLength: 16 }],
              'repo-homepage': [{ mode: 1 }]
            }
          }
        });
        // console.log(util.inspect(repoSourceRules, {depth: null}));
      });
    });
  });
});
