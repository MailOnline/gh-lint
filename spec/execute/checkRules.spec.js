'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('./github_mock');
const github = require('../../lib/execute/github');


describe('checkRules', () => {
  afterEach(() => {
    nock.cleanAll();
    github.clearTeams();
  });

  it('should execute rules (all pass)', () => {
    githubMock.mock('/repos/milojs/milo', '../fixtures/milo-repo-meta');

    const config = {
      org: 'MailOnline',
      repositories: {
        'milojs/milo': {
          rules: {
            'repo-description': 2,
            'repo-homepage': 1
          }
        }
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'repo-description': {valid: true},
          'repo-homepage': {valid: true}
        }
      });
      assert(nock.isDone());
    });
  });


  it('should execute rules (some fail)', () => {
    githubMock.mock('/repos/MailOnline/videojs-vast-vpaid', '../fixtures/videojs-vast-vpaid-repo-meta');
    githubMock.mock('/repos/milojs/milo', '../fixtures/milo-repo-meta');

    const config = require('../fixtures/config-repos.json');

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'repo-description': {valid: true},
          'repo-homepage': {valid: true}
        },
        'MailOnline/videojs-vast-vpaid': {
          'repo-description': {valid: true},
          'repo-homepage': {
            errors: 'data.homepage should be string',
            message: 'not satisfied',
            mode: 1,
            valid: false
          }
        }
      });
      assert(nock.isDone());
    });
  });


  it.skip('should execute rules for all repos in two orgs', () => {
    githubMock.repos.organization.MailOnline.list();
    githubMock.repos.organization.MailOnline.meta();

    githubMock.repos.organization.milojs.list();
    githubMock.repos.organization.milojs.meta();

    const config = require('../fixtures/config-orgs.json');

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/config-orgs_expected_results.json'));
      assert(nock.isDone());
    });
  });


  it('should execute rules for all repos assigned to a team with admin permission only', () => {
    githubMock.teams();
    githubMock.repos.team.mol_fe.list();
    githubMock.repos.team.mol_fe.meta('admin');

    const config = require('../fixtures/config-teams.json');

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/config-teams_expected_results.json'));
      assert(nock.isDone());
    });
  });


  it('should execute rules for all repos assigned to a team with any permission level', () => {
    githubMock.teams();
    githubMock.repos.team.mol_fe.list();
    githubMock.repos.team.mol_fe.meta();

    const config = require('../fixtures/config-teams.json');

    return execute.checkRules(config, {teamAccess: 'read'})
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/config-teams_read-access_expected_results.json'));
      assert(nock.isDone());
    });
  });
});
