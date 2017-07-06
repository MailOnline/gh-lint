'use strict';

const rp = require('request-promise');

const ghApi = 'https://api.github.com';
let orgTeams = {};
let options = {};

module.exports = github;


function github (method, ghPath, qs={}, json=true) {
  return rp({
    uri: ghApi + ghPath,
    method,
    json,
    qs,
    auth: options.auth,
    headers: {
      'User-Agent': 'gh-lint',
      Accept: 'application/vnd.github.loki-preview+json'
    }
  });
}


Object.assign(github, {
  get: httpMethod('get'),
  post: httpMethod('post'),
  put: httpMethod('put'),
  del: httpMethod('del'),
  allPages,

  getSource: {
    meta (orgRepo) {
      return github.get(`/repos/${orgRepo}`);
    },
    branches (orgRepo) {
      return allPages(`/repos/${orgRepo}/branches`);
    },
    teams (orgRepo) {
      return allPages(`/repos/${orgRepo}/teams`);
    },
    commits (orgRepo) {
      const {since, until} = options.commits;
      return allPages(`/repos/${orgRepo}/commits`, {since, until});
    },
    async prs (orgRepo) {
      // "/issues" API is used here as "/pulls" does not support "since" parameter
      // and "/search" has a very low rate limit
      const since = options.commits.since;
      const issues = await allPages(`/repos/${orgRepo}/issues`, {since, state: 'all'});
      return issues.filter((i) => i.pull_request);
    },
    async readme (orgRepo) {
      try {
        return await github.get(`/repos/${orgRepo}/readme`);
      } catch(err) {
        if (err.statusCode != 404) throw err;
        return err.response.body;
      }
    }
  },
  getRepos: {
    organization (org) {
      return allPages(`/orgs/${org}/repos`, { type: 'sources' });
    },
    async team (org, teamName) {
      const teams = await github.getTeams(org);
      const team = teams.find(t => t.name == teamName);
      // TODO if team not found
      const repos = await allPages(`/teams/${team.id}/repos`);
      return repos.filter((r) => !r.fork);
    }
  },
  async getTeams (org) {
    if (!orgTeams[org]) {
      orgTeams[org] = allPages(`/orgs/${org}/teams`);
      orgTeams[org] = await orgTeams[org];
    }
    return orgTeams[org];
  },
  clearTeams() {
    orgTeams = {};
  },
  setOptions (opts) {
    options = opts;
  }
});


function httpMethod(method) {
  return function (ghPath, qs={}, json=true) {
    return github(method, ghPath, qs, json);
  };
}


const PAGE_SIZE = 30;
async function allPages(ghPath, qs={}, json=true) {
  qs.per_page = PAGE_SIZE;
  qs.page = 1;
  let result = [], rows;

  do {
    rows = await github.get(ghPath, qs, json);
    if (!Array.isArray(rows)) throw new Error('expected array in response');
    result = result.concat(rows);
    qs.page++;
  } while (rows && rows.length >= PAGE_SIZE);

  return result;
}
