'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule repo-team', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that repo is assigned to one of specified teams (team is admin)', () => {
    githubMock.repos.organization.MailOnline.list();
    githubMock.repos.organization.MailOnline.teams();

    const config = {
      org: 'MailOnline',
      rules: {
        'repo-team': [2, {
          teams: ['#ads', '#cc', '#clj', '#ios-ny', '#ml-nlp', '#mol-fe', '#rc', '#rta', '#support', '#systems', 'Metro', 'IOS']
        }]
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/repo-team_expected_results.json'));
      assert(nock.isDone());
    });
  });

  it('should check that repo is assigned to one of specified teams and this team has specified permission ', () => {
    githubMock.repos.organization.MailOnline.list();
    githubMock.repos.organization.MailOnline.teams();

    const config = {
      org: 'MailOnline',
      rules: {
        'repo-team': [2, {
          teams: ['#ads', '#cc', '#clj', '#ios-ny', '#ml-nlp', '#mol-fe', '#rc', '#rta', '#support', '#systems', 'Metro', 'IOS'],
          minPermission: 'write'
        }]
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/repo-team_write_expected_results.json'));
      assert(nock.isDone());
    });
  });
});
