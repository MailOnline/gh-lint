
'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule commit-user', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that commit commit author and commiter have associated GitHub user login', () => {
    githubMock.mock('/repos/MailOnline/jest-tap-reporter/commits?since=2017-04-23&per_page=30&page=1', '../fixtures/mailonline_jest-tap-reporter_commits');
    githubMock.mock('/repos/milojs/milo/commits?since=2017-04-23&per_page=30&page=1', '../fixtures/milojs_milo_commits');

    const config = {
      org: 'MailOnline',
      repositories: {
        'jest-tap-reporter': {
          rules: {
            'commit-user': 2
          }
        },
        'milojs/milo': {
          rules: {
            'commit-user': 2
          }
        }
      }
    };

    return execute.checkRules(config, {commits: {since: '2017-04-23'}})
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/commit-user_expected_results.json'));
      assert(nock.isDone());
    });
  });
});
