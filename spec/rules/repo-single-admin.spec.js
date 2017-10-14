'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule repo-single-admin', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that repo has exactly one admin team', () => {
    githubMock.repos.organization.MailOnline.list();
    githubMock.repos.organization.MailOnline.teams();

    const config = {
      org: 'MailOnline',
      rules: {
        'repo-single-admin': 2
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/repo-single-admin_expected_results.json'));
      assert(nock.isDone());
    });
  });
});
