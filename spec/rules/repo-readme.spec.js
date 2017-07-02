'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule repo-readme', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that repo has README file', () => {
    githubMock.mock('/repos/milojs/milo/readme', '../fixtures/milojs_milo_readme.json');
    githubMock.mock('/repos/milojs/new-repo/readme', '../fixtures/milojs_new-repo_readme.json');

    const config = {
      org: 'milojs',
      repositories: {
        'milo, new-repo': {
          rules: {
            'repo-readme': 2
          }
        }
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/repo-readme_expected_results.json'));
      assert(nock.isDone());
    });
  });
});
