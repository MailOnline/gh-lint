'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule branch-protection', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that all required branches are protected', () => {
    githubMock.repos.organization.milojs.branches();

    const config = {
      org: 'milojs',
      repositories: {
        'milo': {
          rules: {
            'branch-protection': 2
          }
        },
        'new-repo, slack-clone': {
          rules: {
            'branch-protection': [2, {branches: ['master', 'next-release']}]
          }
        }
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/branch-protection_expected_results.json'));
      assert(nock.isDone());
    });
  });
});
