'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule pr-approved', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that all merged PRs have been approved', () => {
    githubMock.issues.milo.list();
    githubMock.issues.milo.pull(86);
    githubMock.issues.milo.reviews(86);
    githubMock.issues.milo.pull(80);
    githubMock.issues.milo.reviews(80);

    const config = {
      org: 'milojs',
      repositories: {
        'milo': {
          rules: {
            'pr-approved': 2
          }
        }
      }
    };

    return execute.checkRules(config, {commits: {since: '2017-05-01'}})
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'pr-approved': {
            valid: false,
            message: '1 unapproved PR merged by @jasoniangreen',
            messages: [
              'Unapproved PR merged by @jasoniangreen:\nhttps://github.com/milojs/milo/pull/80\nchore: component.isReaady = false on destroy'
            ],
            mode: 2
          }
        }
      });
      assert(nock.isDone());
    });
  });
});
