'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');

describe('checkRules', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should execute rules (all pass)', () => {
    nock('https://api.github.com')
    .get('/repos/milojs/milo')
    .reply(200, require('../fixtures/milo-repo-meta'));

    const config = {
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

    return execute.checkRules(config)
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
    .reply(200, require('../fixtures/videojs-vast-vpaid-repo-meta'));

    nock('https://api.github.com')
    .get('/repos/milojs/milo')
    .reply(200, require('../fixtures/milo-repo-meta'));

    const repoSourceRules = {
      org: 'MailOnline',
      repositories: {
        'milojs/milo': {
          rules: {
            'repo-description': 2,
            'repo-homepage': 1
          }
        },
        'videojs-vast-vpaid': {
          rules: {
            'repo-description': 2,
            'repo-homepage': 1
          }
        }
      }
    };

    return execute.checkRules(repoSourceRules)
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'repo-description': [], // no errors
          'repo-homepage': []     // no errors
        },
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
