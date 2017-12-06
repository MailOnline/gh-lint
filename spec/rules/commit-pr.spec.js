'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule commit-pr', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that all merged PRs have been approved', () => {
    githubMock.issues.milo.list();
    githubMock.issues.milo.pull(86);
    githubMock.issues.milo.commits(86);
    githubMock.issues.milo.pull(80);
    githubMock.issues.milo.commits(80);
    githubMock.mock('/repos/milojs/milo/commits?since=2017-05-01&per_page=30&page=1', '../fixtures/milojs_milo_commits');

    const config = {
      org: 'milojs',
      repositories: {
        'milo': {
          rules: {
            'commit-pr': 2
          }
        }
      }
    };

    return execute.checkRules(config, {commits: {since: '2017-05-01'}})
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'commit-pr': {
            valid: false,
            message: '1 commit without PR by @jasoniangreen',
            messages: [
              'Commit without PR by @jasoniangreen:\nhttps://github.com/milojs/milo/commit/3121a99223d547be62134d87728dbc56a7f4f853\nchore: remove only from css tests'
            ],
            mode: 2
          }
        }
      });
      assert(nock.isDone());
    });
  });
});
