'use strict';

var co = require('co');
var execute = require('../../lib/execute');
var assert = require('assert');
var nock = require('nock');

describe('checkRules', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should execute rules (all pass)', () => {
    nock('https://api.github.com')
    .get('/repos/milojs/milo')
    .reply(200, require('../fixtures/milo-repo-meta'))

    var config = {
      org: 'MailOnline',
      repositories: {
        'milojs/milo': {
          rules: {
            'repo-description': 2,
            'repo-homepage': 1
          }
        }
      }
    };

    return co(execute.checkRules(config))
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'repo-description': [], // no errors
          'repo-homepage': []     // no errors
        }
      });
    });
  });


  it('should execute rules (some fail)', () => {
    nock('https://api.github.com')
    .get('/repos/MailOnline/videojs-vast-vpaid')
    .reply(200, require('../fixtures/videojs-vast-vpaid-repo-meta'))

    var repoSourceRules = {
      org: 'MailOnline',
      repositories: {
        'videojs-vast-vpaid': {
          rules: {
            'repo-description': 2,
            'repo-homepage': 1
          }
        }
      }
    };

    return co(execute.checkRules(repoSourceRules))
    .then((results) => {
      assert.deepStrictEqual(results, {
        'MailOnline/videojs-vast-vpaid': {
          'repo-description': [], // no errors
          'repo-homepage': [
            {
              errors: 'data.homepage should be string',
              message: 'repo-homepage is not satisfied',
              mode: 1,
              valid: false
            }
          ]
        }
      });
    });
  });
});
