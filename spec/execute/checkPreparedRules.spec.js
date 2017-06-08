'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('./github_mock');


describe('checkPreparedRules', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should execute rules (all pass)', () => {
    githubMock.mock('/repos/milojs/milo', '../fixtures/milo-repo-meta');

    const repoSourceRules = {
      'milojs/milo': {
        meta: {
          'repo-description': [{ mode: 2, minLength: 16 }],
          'repo-homepage': [{ mode: 1 }]
        }
      }
    };

    return execute.checkPreparedRules(repoSourceRules)
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'repo-description': [], // no errors
          'repo-homepage': []     // no errors
        }
      });
      assert(nock.isDone());
    });
  });


  it('should execute rules (some fail)', () => {
    githubMock.mock('/repos/MailOnline/videojs-vast-vpaid', '../fixtures/videojs-vast-vpaid-repo-meta');

    const repoSourceRules = {
      'MailOnline/videojs-vast-vpaid': {
        meta: {
          'repo-description': [{ mode: 2, minLength: 16 }],
          'repo-homepage': [{ mode: 1 }]
        }
      }
    };

    return execute.checkPreparedRules(repoSourceRules)
    .then((results) => {
      assert.deepStrictEqual(results, {
        'MailOnline/videojs-vast-vpaid': {
          'repo-description': [], // no errors
          'repo-homepage': [
            {
              errors: 'data.homepage should be string',
              message: 'not satisfied',
              mode: 1,
              valid: false
            }
          ]
        }
      });
      assert(nock.isDone());
    });
  });
});
