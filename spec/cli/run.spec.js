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
        assert.equal(log, 'warning MailOnline/videojs-vast-vpaid: repo-homepage - not satisfied');
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

    it('should check repos in orgs within date range', () => {
      githubMock.repos.organization.MailOnline.list();
      githubMock.repos.organization.milojs.list();
      githubMock.mock('/repos/MailOnline/json-schema-test', '../fixtures/mailonline_repos/json-schema-test');
      githubMock.mock('/repos/MailOnline/ImageViewer', '../fixtures/mailonline_repos/ImageViewer');
      githubMock.mock('/repos/milojs/milo', '../fixtures/milojs_repos/milo');

      return ok(run([
        '--config', './spec/fixtures/config-orgs.json',
        '--after', '2017-01-20', '--before', '2017-02-01'
      ], false)).then(() => {
        assert.equal(log, 'warning MailOnline/json-schema-test: repo-homepage - not satisfied\n' +
                          'warning MailOnline/ImageViewer: repo-homepage - not satisfied');
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
