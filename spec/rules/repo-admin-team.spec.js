'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule repo-admin-team', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that repo has exactly one admin team', () => {
    githubMock.repos.organization.MailOnline.list();
    githubMock.repos.organization.MailOnline.teams();

    const config = {
      org: 'MailOnline',
      rules: {
        'repo-admin-team': [2, {
          maximum: 1
        }]
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      // console.log(JSON.stringify(results, null, 2));
      assert.deepStrictEqual(results, require('../fixtures/repo-admin-team_expected_results.json'));
      assert(nock.isDone());
    });
  });

  it('should check that repo has no more than one admin team', () => {
    githubMock.repos.organization.MailOnline.list();
    githubMock.repos.organization.MailOnline.teams();

    const config = {
      org: 'MailOnline',
      rules: {
        'repo-admin-team': [2, {
          required: false,
          maximum: 1
        }]
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      // console.log(JSON.stringify(results, null, 2));
      assert.deepStrictEqual(results, require('../fixtures/repo-admin-team_not-required_expected_results.json'));
      assert(nock.isDone());
    });
  });
});
