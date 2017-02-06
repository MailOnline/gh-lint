'use strict';

const github = require('../../lib/execute/github');
const assert = require('assert');
const nock = require('nock');


describe('github', function() {
  this.timeout(20000);

  afterEach(() => {
    nock.cleanAll();
    github.clearTeams();
  });

  describe('.getTeams', () => {
    it('should return cached list of org teams', () => {
      mockTeams();
      const teamsPage1 = require('../fixtures/mailonline_teams_page1.json');
      const teamsPage2 = require('../fixtures/mailonline_teams_page2.json');

      return github.getTeams('MailOnline')
      .then(result => {
        assert.deepStrictEqual(result, teamsPage1.concat(teamsPage2));
        assert(nock.isDone());
        return github.getTeams('MailOnline'); // cached
      })
      .then(result => {
        assert.deepStrictEqual(result, teamsPage1.concat(teamsPage2));
      });
    });
  });


  describe('.getRepos', () => {
    describe('.organization', () => {
      it('should load organization repos', () => {
        nock('https://api.github.com')
        .get('/orgs/MailOnline/repos?type=sources&per_page=30&page=1')
        .reply(200, require('../fixtures/mailonline_repos_page1.json'))
        .get('/orgs/MailOnline/repos?type=sources&per_page=30&page=2')
        .reply(200, require('../fixtures/mailonline_repos_page2.json'));

        return github.getRepos.organization('MailOnline')
        .then(result => {
          const repoNames = result.map(r => r.name);
          const forks = result.filter(r => r.fork);
          const priv = result.filter(r => r.private);

          assert.deepEqual(repoNames, require('../fixtures/mailonline_expected_reponames.json'));
          assert.deepEqual(forks, []);
          assert.deepEqual(priv, []);

          assert(nock.isDone());
        });
      });
    });


    describe('.team', () => {
      it('should load organization repos', () => {
        mockTeams();

        nock('https://api.github.com')
        .get('/teams/25/repos?per_page=30&page=1')
        .reply(200, require('../fixtures/molfe_repos.json'));

        return github.getRepos.team('MailOnline', '#mol-fe')
        .then(result => {
          assert.deepStrictEqual(result, require('../fixtures/molfe_repos.json'));
          assert(nock.isDone());
        });
      });
    });
  });


  function mockTeams() {
    nock('https://api.github.com')
    .get('/orgs/MailOnline/teams?per_page=30&page=1')
    .reply(200, require('../fixtures/mailonline_teams_page1.json'))
    .get('/orgs/MailOnline/teams?per_page=30&page=2')
    .reply(200, require('../fixtures/mailonline_teams_page2.json'));
  }
});
