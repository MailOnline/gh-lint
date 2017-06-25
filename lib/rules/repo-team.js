'use strict';

module.exports = {
  meta: {
    name: 'repo-team',
    description: 'check that repo is assigned to one of specified teams',
    category: 'Repo',
    recommended: true
  },

  schema: {
    type: 'object',
    required: ['teams'],
    properties: {
      teams: {
        type: 'array',
        minItems: 1,
        items: {type: 'string'}
      }
    }
  },

  source: 'teams',

  check(cfg, repoTeams) {
    for (const team of repoTeams)
      if (cfg.teams.indexOf(team.name) >= 0) return {valid: true};

    return {
      valid: false,
      message: 'Repo not assigned to one of specified teams',
      messages: [`Specified teams: ${cfg.teams.join(', ')}`]
    };
  },

  issue: {
    title: 'Repo is not assigned to any of the teams',
    comments: {
      create: 'Please add repo to the team',
      close: 'Repo added to the team, closing',
      reopen: 'Repo is not added to any team, probably removed. Please fix it'
    }
  }
};
