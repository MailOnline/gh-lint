'use strict';

const github = require('../../lib/execute/github');
const assert = require('assert');
const nock = require('nock');
const githubMock = require('./github_mock');


describe('github', function() {
  this.timeout(20000);

  afterEach(() => {
    nock.cleanAll();
    github.clearTeams();
  });

  describe('.getTeams', () => {
    it('should return cached list of org teams', () => {
      githubMock.teams();
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
        githubMock.repos.organization.MailOnline.list();

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
      it('should load team repos only with admin team access', () => {
        githubMock.teams();
        githubMock.repos.team.mol_fe.list();

        return github.getRepos.team('MailOnline', '#mol-fe')
        .then(result => {
          const expectedRepos = require('../fixtures/molfe_repos.json')
                                .filter(r => r.permissions.admin);
          assert.deepStrictEqual(result, expectedRepos);
          assert(nock.isDone());
        });
      });

      it('should load team repos with any access', () => {
        githubMock.teams();
        githubMock.repos.team.mol_fe.list();

        return github.getRepos.team('MailOnline', '#mol-fe', 'read')
        .then(result => {
          assert.deepStrictEqual(result, require('../fixtures/molfe_repos.json'));
          assert(nock.isDone());
        });
      });
    });
  });
});
