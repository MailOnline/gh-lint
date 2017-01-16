'use strict';

var co = require('co');
var execute = require('../../lib/execute');
var assert = require('assert');
var nock = require('nock');

describe('checkPreparedRules', () => {
  var githubMock;

  beforeEach(() => {
    githubMock = nock('https://api.github.com')
    .get('/repos/milojs/milo')
    .reply(200, require('../fixtures/milo-repo-meta'))
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should execute rules', () => {
    var repoSourceRules = {
      'milojs/milo': {
        meta: {
          'repo-description': [{ mode: 2, minLength: 16 }],
          'repo-homepage': [{ mode: 1 }]
        }
      }
    };

    return co(execute.checkPreparedRules(repoSourceRules))
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          meta: {
            'repo-description': [], // no errors
            'repo-homepage': []     // no errors
          }
        }
      });
    });
  });
});
