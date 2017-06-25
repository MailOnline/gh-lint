'use strict';

const run = require('../../lib/cli/run');
const githubMock = require('../execute/github_mock');
const assert = require('assert');
const nock = require('nock');
const fs = require('fs');
const path = require('path');


describe('cli', () => {
  let log;
  const cons = {};

  beforeEach(() => {
    replaceConsole();
    log = '';
  });

  afterEach(() => {
    restoreConsole();
    nock.cleanAll();
  });

  describe('check command', () => {
    it('should check repos', () => {
      githubMock.mock('/repos/MailOnline/videojs-vast-vpaid', '../fixtures/videojs-vast-vpaid-repo-meta');
      githubMock.mock('/repos/milojs/milo', '../fixtures/milo-repo-meta');

      return ok(run(['check', '-c', './spec/fixtures/config-repos.json'], false))
      .then(() => {
        assert.equal(log,
`warning MailOnline/videojs-vast-vpaid: repo-homepage - not satisfied
passed 3 out of 4`);
        assert(nock.isDone());
      });
    });

    it('should check repos with YAML config', () => {
      githubMock.mock('/repos/MailOnline/videojs-vast-vpaid', '../fixtures/videojs-vast-vpaid-repo-meta');
      githubMock.mock('/repos/milojs/milo', '../fixtures/milo-repo-meta');

      return ok(run(['check', '-c', './spec/fixtures/config-repos.yml'], false))
      .then(() => {
        assert.equal(log,
`warning MailOnline/videojs-vast-vpaid: repo-homepage - not satisfied
passed 3 out of 4`);
        assert(nock.isDone());
      });
    });

    it('should check repos in orgs', () => {
      githubMock.repos.organization.MailOnline.list();
      githubMock.repos.organization.MailOnline.meta();

      githubMock.repos.organization.milojs.list();
      githubMock.repos.organization.milojs.meta();

      return fail(run(['--config', './spec/fixtures/config-orgs.json'], false))
      .then(() => {
        const expectedOutput = fs.readFileSync(path.join(__dirname, '../fixtures/config-orgs_expected_cli_output.txt'), 'utf8');
        assert.equal(log, expectedOutput);
        assert(nock.isDone());
      });
    });

    describe('date range', () => {
      it('should check repos in orgs within date range', () => {
        test(['--after', '2017-01-20', '--before', '2017-02-01']);
      });

      it('should check repos in orgs changed in the last X days', () => {
        test(['--after', getDays('2017-01-20'), '--before', getDays('2017-02-01')]);
      });

      function test(range) {
        githubMock.repos.organization.MailOnline.list();
        githubMock.repos.organization.MailOnline.meta(['cuteyp', 'json-schema-test', 'ImageViewer', 'gh-lint']);
        githubMock.repos.organization.milojs.list();
        githubMock.repos.organization.milojs.meta(['milo', 'proto', 'milo-core']);

        const params = ['--config', './spec/fixtures/config-orgs.json'].concat(range);
        return ok(run(params, false)).then(() => {
          assert.equal(log,
`warning MailOnline/cuteyp: repo-homepage - not satisfied
warning MailOnline/json-schema-test: repo-homepage - not satisfied
warning MailOnline/ImageViewer: repo-homepage - not satisfied
warning MailOnline/gh-lint: repo-homepage - not satisfied
warning milojs/milo-core: repo-homepage - not satisfied`);
          assert(nock.isDone());
        });
      }

      function getDays(dateStr) {
        return Math.floor((Date.now() - new Date(dateStr).getTime())/86400000);
      }
    });

    it('should output results in TAP format', () => {
      githubMock.mock('/repos/MailOnline/videojs-vast-vpaid', '../fixtures/videojs-vast-vpaid-repo-meta');
      githubMock.mock('/repos/milojs/milo', '../fixtures/milo-repo-meta');

      return ok(run(['check', '--tap', '-c', './spec/fixtures/config-repos.json'], false))
      .then(() => {
        assert.equal(log.match(/not ok/g).length, 2);
        assert(/not ok \d MailOnline\/videojs-vast-vpaid: repo-homepage/.test(log));
        assert(nock.isDone());
      });
    });
  });


  describe('help command', () => {
    it('should log help', () => {
      return ok(run(['help'], false))
      .then(() => {
        assert(/help/.test(log));
      });
    });

    it('should log help for check', () => {
      return ok(run(['help', 'check'], false))
      .then(() => {
        assert(/Check repositiories/.test(log));
      });
    });

    it('should return error for unknown command in help', () => {
      return fail(run(['help', 'unknown'], false))
      .then(() => {
        assert(/Unknown command/.test(log));
      });
    });
  });


  describe('errors', () => {
    it('should return error for unknown command', () => {
      return fail(run(['unknown'], false))
      .then(() => {
        assert(/Unknown command/.test(log));
      });
    });

    it('should return error for unknown options', () => {
      return fail(run(['check', '--unknown'], false))
      .then(() => {
        assert(/error: parameter --unknown/.test(log));
      });
    });
  });


  function replaceConsole() {
    eachCons(method => {
      cons[method] = console[method];
      console[method] = saveLog;
    });
  }

  function restoreConsole() {
    eachCons(method => {
      console[method] = cons[method];
    });
  }

  function ok(p) {
    return p.then(restoreConsole, (e) => {
      restoreConsole();
      throw e;
    });
  }

  function fail(p) {
    return ok(p)
    .then(
      () => { throw new Error('should have thrown'); },
      () => {}
    );
  }

  function eachCons(func) {
    ['log', 'warn', 'error'].forEach(func);
  }

  function saveLog() {
    if (log) log += '\n';
    log += Array.prototype.join.call(arguments, ' ');
  }
});
