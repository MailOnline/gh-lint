'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('./github_mock');
const github = require('../../lib/execute/github');
// const util = require('util');


describe('prepareRepoRules', () => {
  afterEach(() => {
    nock.cleanAll();
    github.clearTeams();
  });

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

    it('should support comma-separated list of repositories', () => {
      const config = execute.prepareConfig({
        org: 'MailOnline',
        repositories: {
          'mol-fe, milojs/milo': {
            rules: {
              'repo-description': 2,
              'repo-homepage': 1
            }
          }
        }
      });

      return execute.prepareRepoRules(config)
      .then(repoSourceRules => {
        assert.deepStrictEqual(repoSourceRules, {
          'MailOnline/mol-fe': {
            meta: {
              'repo-description': [{ mode: 2, minLength: 1 }],
              'repo-homepage': [{ mode: 1, minLength: 1 }]
            }
          },
          'milojs/milo': {
            meta: {
              'repo-description': [{ mode: 2, minLength: 1 }],
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
          'MailOnline/cuteyp': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
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
          'MailOnline/gh-lint': {
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
          },
          'milojs/proto': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'milojs/milo-core': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          }
        });
        assert(nock.isDone());
        // console.log(util.inspect(repoSourceRules, {depth: null}));
      });
    });
  });


  describe('teams scope', () => {
    it('should collect rules for repos for team', () => {
      githubMock.teams();
      githubMock.repos.team.mol_fe.list();

      const config = execute.prepareConfig(require('../fixtures/config-teams.json'));

      return execute.prepareRepoRules(config)
      .then(repoSourceRules => {
        assert.deepStrictEqual(repoSourceRules, {
          'MailOnline/eslint-config-mailonline': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/mol-conventional-changelog': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/stylelint-config-mailonline': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/videojs-vast-vpaid': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/VPAIDFLASHClient': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/VPAIDHTML5Client': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          }
        });
        assert(nock.isDone());
        // console.log(util.inspect(repoSourceRules, {depth: null}));
      });
    });

    it('should collect rules for repos for team excluding disabled rules', () => {
      githubMock.teams();
      githubMock.repos.team.mol_fe.list();

      const config = execute.prepareConfig(require('../fixtures/config-teams-excluding-repos.json'));

      return execute.prepareRepoRules(config)
      .then(repoSourceRules => {
        assert.deepStrictEqual(repoSourceRules, {
          'MailOnline/videojs-vast-vpaid': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/VPAIDFLASHClient': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          },
          'MailOnline/VPAIDHTML5Client': {
            meta: {
              'repo-description': [ { mode: 2, minLength: 1 } ],
              'repo-homepage': [ { mode: 1, minLength: 1 } ]
            }
          }
        });
        assert(nock.isDone());
        // console.log(util.inspect(repoSourceRules, {depth: null}));
      });
    });
  });
});
