'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const githubMock = require('./github_mock');


describe('prepareRepoRules', () => {
  describe('repositories scope', () => {
    it('should collect sources and rules for all repositories', () => {
      const config = execute.prepareConfig({
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
      });

      return execute.prepareRepoRules(config)
      .then(repoSourceRules => {
        assert.deepStrictEqual(repoSourceRules, {
          'MailOnline/mol-fe': {
            meta: { 'repo-description': [{ mode: 2, minLength: 1 }] } },
          'milojs/milo': {
            meta: {
              'repo-description': [{ mode: 2, minLength: 16 }],
              'repo-homepage': [{ mode: 1, minLength: 1 }]
            }
          }
        });
        // console.log(util.inspect(repoSourceRules, {depth: null}));
      });
    });
  });


  describe('organizations scope', () => {
    it('should collect rules for repos from two orgs updated within date range', () => {
      githubMock.repos.organization.MailOnline.list();
      githubMock.repos.organization.milojs.list();

      const config = execute.prepareConfig(require('../fixtures/config-orgs.json'));

      return execute.prepareRepoRules(config, {
        after: new Date('2017-01-20'),
        before: new Date('2017-02-01')
      })
      .then(repoSourceRules => {
        assert.deepStrictEqual(repoSourceRules, {
          'MailOnline/json-schema-test': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/ImageViewer': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'milojs/milo': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          }
        });
        // console.log(util.inspect(repoSourceRules, {depth: null}));
      });
    });
  });
});
