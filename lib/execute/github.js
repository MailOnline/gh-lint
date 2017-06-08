'use strict';

const rp = require('request-promise');

const ghApi = 'https://api.github.com';
let orgTeams = {};

module.exports = github;


function github(method, ghPath, options={}, qs={}, json=true) {
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
    meta (orgRepo, options={}) {
      return github.get(`/repos/${orgRepo}`, options);
    },
    branches(orgRepo, options={}) {
      return allPages(`/repos/${orgRepo}/branches`, options);
    }
  },
  getRepos: {
    organization (org, options={}) {
      return allPages(`/orgs/${org}/repos`, options, { type: 'sources' });
    },
    team (org, teamName, options={}) {
      return github.getTeams(org, options).then(teams => {
        const team = teams.find(t => t.name == teamName);
        // TODO if team not found
        return allPages(`/teams/${team.id}/repos`, options);
      });
    }
  },
  getTeams: (org, options={}) => {
    if (orgTeams[org]) return Promise.resolve(orgTeams[org]);
    const p = orgTeams[org] = allPages(`/orgs/${org}/teams`, options);

    p.then(
      teams => (orgTeams[org] = teams),
      err => { console.error(err); delete orgTeams[org]; }
    );

    return p;
  },
  clearTeams: () => (orgTeams = {})
});


function httpMethod(method) {
  return function (ghPath, options={}, qs={}, json=true) {
    return github(method, ghPath, options, qs, json);
  };
}


const PAGE_SIZE = 30;
function allPages(ghPath, options={}, qs={}, json=true) {
  qs.per_page = PAGE_SIZE;
  let result = [];
  let page = 1;
  return getPage();

  function getPage() {
    qs.page = page;
    return github.get(ghPath, options, qs, json)
    .then(rows => {
      result.push.apply(result, rows);
      if (rows.length < PAGE_SIZE) return result;
      page++;
      return getPage();
    });
  }
}
