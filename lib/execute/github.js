'use strict';

const rp = require('request-promise');

const ghApi = 'https://api.github.com';
let orgTeams = {};

const github = module.exports = {
  getSource: {
    meta (orgRepo, options={}) {
      return rp.get({
        uri: `${ghApi}/repos/${orgRepo}`,
        json: true,
        auth: options.auth,
        headers: { 'User-Agent': 'gh-lint' }
      });
    }
  },
  getRepos: {
    organization (org, options={}) {
      return allPages(`/orgs/${org}/repos`, options, { type: 'sources' });
    },
    team (org, teamName, options={}) {
      return github.getTeams(org, options).then(teams => {
        const team = teams.find(t => t.name == teamName);
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
};


const PAGE_SIZE = 30;
function allPages(ghPath, options, qs={}) {
  qs.per_page = PAGE_SIZE;
  let result = [];
  let page = 1;
  return getPage();

  function getPage() {
    qs.page = page;
    return rp.get({
      uri: ghApi + ghPath,
      json: true,
      auth: options.auth,
      headers: {
        'User-Agent': 'gh-lint'
      },
      qs,
    }).then(rows => {
      result.push.apply(result, rows);
      if (rows.length < PAGE_SIZE) return result;
      page++;
      return getPage();
    });
  }
}
