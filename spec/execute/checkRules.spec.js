'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const glob = require('glob');
const path = require('path');

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
      assert(nock.isDone());
    });
  });


  it('should execute rules (some fail)', () => {
    nock('https://api.github.com')
    .get('/repos/MailOnline/videojs-vast-vpaid')
    .reply(200, require('../fixtures/videojs-vast-vpaid-repo-meta'))
    .get('/repos/milojs/milo')
    .reply(200, require('../fixtures/milo-repo-meta'));

    const config = require('../fixtures/config-repos.json');

    return execute.checkRules(config)
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


  it('should execute rules for all repos in two orgs', () => {
    nock('https://api.github.com')
    .get('/orgs/MailOnline/repos?type=sources&per_page=30&page=1')
    .reply(200, require('../fixtures/mailonline_repos_page1.json'))
    .get('/orgs/MailOnline/repos?type=sources&per_page=30&page=2')
    .reply(200, require('../fixtures/mailonline_repos_page2.json'))
    .get('/orgs/milojs/repos?type=sources&per_page=30&page=1')
    .reply(200, require('../fixtures/milojs_repos.json'));

    glob.sync('../fixtures/mailonline_repos/*.json', { cwd: __dirname })
    .forEach(addRepoMock('MailOnline'));

    glob.sync('../fixtures/milojs_repos/*.json', { cwd: __dirname })
    .forEach(addRepoMock('milojs'));

    const config = require('../fixtures/config-orgs.json');

    return execute.checkRules(config)
    .then((results) => {
      assert.deepStrictEqual(results, require('../fixtures/config-orgs_expected_results.json'));
      assert(nock.isDone());
    });

    function addRepoMock(org) {
      return function (file) {
        const repoName = path.basename(file, '.json');
        nock('https://api.github.com')
        .get(`/repos/${org}/${repoName}`)
        .reply(200, require(file));
      };
    }
  });
});
