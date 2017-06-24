'use strict';

const execute = require('../../lib/execute');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('../execute/github_mock');


describe('rule commit-name', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should check that commit names satisfy semantic commits rules', () => {
    githubMock.mock('/repos/milojs/milo/commits?since=2017-04-23&per_page=30&page=1', '../fixtures/milojs_milo_commits');

    const config = {
      org: 'MailOnline',
      repositories: {
        'milojs/milo': {
          rules: {
            'commit-name': [2, {
              types: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
              maxSubjectLength: 50,
              multiLine: true,
              maxLineLength: 72
            }]
          }
        }
      }
    };

    return execute.checkRules(config, {commits: {since: '2017-04-23'}})
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'commit-name': [
            {
              mode: 2,
              message: "Commit names do not satisfy requirements:\nchore: component.isReaady = false on destroy (#80)\n\n* chore: component.isReaady = false on destroy\r\n\r\n* Update c_class.js\r\n\r\nkeeping `isReady` as such:\r\n\r\n  * `false` when not ready\r\n  * `true` only once dispatching `'stateready'`\r\n  * `undefined` when destroyed (the property is not shadowed 'cause I'm not sure if `false` is set as default in the prototype)\r\n\r\n* Update c_class.js\r\n\r\nBe sure `init()` sets `isReady` as `false`.",
              valid: false
            }
          ]
        }
      });
      assert(nock.isDone());
    });
  });

  it('should use default config', () => {
    githubMock.mock('/repos/milojs/milo/commits?since=2017-04-23&per_page=30&page=1', '../fixtures/milojs_milo_commits');

    const config = {
      org: 'MailOnline',
      repositories: {
        'milojs/milo': {
          rules: {
            'commit-name': 2
          }
        }
      }
    };

    return execute.checkRules(config, {commits: {since: '2017-04-23'}})
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'commit-name': [
            {
              mode: 2,
              message: "Commit names do not satisfy requirements:\nchore: component.isReaady = false on destroy (#80)\n\n* chore: component.isReaady = false on destroy\r\n\r\n* Update c_class.js\r\n\r\nkeeping `isReady` as such:\r\n\r\n  * `false` when not ready\r\n  * `true` only once dispatching `'stateready'`\r\n  * `undefined` when destroyed (the property is not shadowed 'cause I'm not sure if `false` is set as default in the prototype)\r\n\r\n* Update c_class.js\r\n\r\nBe sure `init()` sets `isReady` as `false`.",
              valid: false
            }
          ]
        }
      });
      assert(nock.isDone());
    });
  });

  it('should pass if longer message length allowed', () => {
    githubMock.mock('/repos/milojs/milo/commits?since=2017-04-23&per_page=30&page=1', '../fixtures/milojs_milo_commits');

    const config = {
      org: 'MailOnline',
      repositories: {
        'milojs/milo': {
          rules: {
            'commit-name': [2, {
              maxLineLength: 128
            }]
          }
        }
      }
    };

    return execute.checkRules(config, {commits: {since: '2017-04-23'}})
    .then((results) => {
      assert.deepStrictEqual(results, {
        'milojs/milo': {
          'commit-name': []
        }
      });
      assert(nock.isDone());
    });
  });
});
