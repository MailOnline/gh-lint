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
        meta(repos) {
          glob.sync('../fixtures/mailonline_repos/*.json', { cwd: __dirname })
          .forEach(addRepoMock('MailOnline', repos));
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
        meta(repos) {
          glob.sync('../fixtures/milojs_repos/*.json', { cwd: __dirname })
          .forEach(addRepoMock('milojs', repos));
        },
        branches() {
          glob.sync('../fixtures/milojs_repo_branches/*.list.json', { cwd: __dirname })
          .forEach(addBranchesMock('milojs'));
          glob.sync('../fixtures/milojs_repo_branches/*.branch.json', { cwd: __dirname })
          .forEach(addBranchMock('milojs'));
        }
      }
    },
    team: {
      mol_fe: {
        list() {
          mock('/teams/25/repos?per_page=30&page=1', '../fixtures/molfe_repos.json');
        },
        meta(teamPermission) { // 'pull', 'push', 'admin'
          const repos = require('../fixtures/molfe_repos.json');
          for (const repo of repos) {
            if (!teamPermission || repo.permissions[teamPermission])
              mock(`/repos/MailOnline/${repo.name}`, path.join(__dirname, `../fixtures/mailonline_repos/${repo.name}.json`));
          }
        }
      }
    }
  },
  issues: {
    milo: {
      list() {
        mock('/repos/milojs/milo/issues?since=2017-05-01&state=all&per_page=30&page=1',
          '../fixtures/milojs_milo_issues.json');
      },
      pull(number) {
        mock(`/repos/milojs/milo/pulls/${number}`, `../fixtures/milojs_milo_pull${number}.json`);
      },
      reviews(pullNumber) {
        mock(`/repos/milojs/milo/pulls/${pullNumber}/reviews?per_page=30&page=1`,
          `../fixtures/milojs_milo_pull${pullNumber}_reviews.json`);
      },
      commits(pullNumber) {
        mock(`/repos/milojs/milo/pulls/${pullNumber}/commits?per_page=30&page=1`,
          `../fixtures/milojs_milo_pull${pullNumber}_commits.json`);
      }
    }
  }
};


function mock(apiPath, file, statusCode=200) {
  nock('https://api.github.com').get(apiPath).reply(statusCode, require(file));
}


function addRepoMock(org, repos) {
  return function (file) {
    const repoName = path.basename(file, '.json');
    if (!repos || repos.indexOf(repoName) >= 0)
      mock(`/repos/${org}/${repoName}`, file);
  };
}


function addTeamsMock(org) {
  return function (file) {
    const repoName = path.basename(file, '.json');
    mock(`/repos/${org}/${repoName}/teams?per_page=30&page=1`, file);
  };
}


function addBranchesMock(org) {
  return function (file) {
    const repoName = path.basename(file, '.list.json');
    mock(`/repos/${org}/${repoName}/branches?per_page=30&page=1`, file);
  };
}


function addBranchMock(org) {
  return function (file) {
    const [repoName, branchName] = path.basename(file, '.branch.json').split('_');
    mock(`/repos/${org}/${repoName}/branches/${branchName}`, file);
  };
}
