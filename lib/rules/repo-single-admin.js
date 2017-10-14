'use strict';

module.exports = {
  meta: {
    name: 'repo-single-admin',
    description: 'check that repo has exactly one admin team',
    category: 'Repo',
    recommended: true
  },

  schema: {},

  source: 'teams',

  check(cfg, repoTeams) {
    let adminTeams = repoTeams
                      .filter(t => t.permission == 'admin')
                      .map(t => t.name);
    if (adminTeams.length == 1) return {valid: true};
    const msg = adminTeams.length == 0
                ? 'Repo has no admin team'
                : `Repo has ${adminTeams.length} admin teams: ${adminTeams.join(', ')}`;
    return {
      valid: false,
      message: msg,
      messages: [msg]
    };
  },

  issue: {
    title: 'Repo should have one admin team',
    comments: {
      create: 'Please check that repo has one admin team',
      close: 'Repo has one admin team, closing'
    }
  }
};
