'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('./github_mock');
const github = require('../../lib/execute/github');


describe('plugins', () => {
  afterEach(() => {
    nock.cleanAll();
    github.clearTeams();
  });


  it('should execute rule from plugin (passes)', () => {
    githubMock.mock('/repos/MailOnline/mol-utils', '../fixtures/mailonline_repos/mol-utils.json');

    const config = {
      org: 'MailOnline',
      plugins: ['ghlint-plugin-example'],
      repositories: {
        'mol-utils': {
          rules: {
            'mol-repo-name': 2
          }
        }
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, {
        'MailOnline/mol-utils': {
          'mol-repo-name':  {valid: true}
        }
      });
      assert(nock.isDone());
    });
  });


  it('should execute rule from plugin (fails)', () => {
    githubMock.mock('/repos/milojs/milo', '../fixtures/milo-repo-meta');

    const config = {
      org: 'milojs',
      plugins: ['example'],
      repositories: {
        'milo': {
          rules: {
            'mol-repo-name': 2
          }
        }
      }
    };

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'mol-repo-name': {
            errors: 'data.name should match pattern "^mol-"',
            message: 'not satisfied',
            mode: 2,
            valid: false
          }
        }
      });
      assert(nock.isDone());
    });
  });
});