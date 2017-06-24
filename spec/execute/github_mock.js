'use strict';

const nock = require('nock');
const glob = require('glob');
const path = require('path');

module.exports = {
  mock,
  teams() {
    mock('/orgs/MailOnline/teams?per_page=30&page=1', '../fixtures/mailonline_teams_page1.json');
    mock('/orgs/MailOnline/teams?per_page=30&page=2', '../fixtures/mailonline_teams_page2.json');
  },
  repos: {
    organization: {
      MailOnline: {
        list() {
          mock('/orgs/MailOnline/repos?type=sources&per_page=30&page=1', '../fixtures/mailonline_repos_page1.json');
          mock('/orgs/MailOnline/repos?type=sources&per_page=30&page=2', '../fixtures/mailonline_repos_page2.json');
        },
        meta() {
          glob.sync('../fixtures/mailonline_repos/*.json', { cwd: __dirname })
          .forEach(addRepoMock('MailOnline'));
        },
        teams() {
          glob.sync('../fixtures/mailonline_repo_teams/*.json', { cwd: __dirname })
          .forEach(addTeamsMock('MailOnline'));
        }
      },
      milojs: {
        list() {
          mock('/orgs/milojs/repos?type=sources&per_page=30&page=1', '../fixtures/milojs_repos.json');
        },
        meta() {
          glob.sync('../fixtures/milojs_repos/*.json', { cwd: __dirname })
          .forEach(addRepoMock('milojs'));
        }
      }
    },
    team: {
      mol_fe: {
        list() {
          mock('/teams/25/repos?per_page=30&page=1', '../fixtures/molfe_repos.json');
        },
        meta() {
          const repos = require('../fixtures/molfe_repos.json');
          for (const repo of repos)
            mock(`/repos/MailOnline/${repo.name}`, path.join(__dirname, `../fixtures/mailonline_repos/${repo.name}.json`));
        }
      }
    }
  }
};


function mock(apiPath, file) {
  nock('https://api.github.com').get(apiPath).reply(200, require(file));
}


function addRepoMock(org) {
  return function (file) {
    const repoName = path.basename(file, '.json');
    mock(`/repos/${org}/${repoName}`, file);
  };
}


function addTeamsMock(org) {
  return function (file) {
    const repoName = path.basename(file, '.json');
    mock(`/repos/${org}/${repoName}/teams?per_page=30&page=1`, file);
  };
}
