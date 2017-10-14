'use strict';

const PERMISSIONS = {
  admin: 2,
  push: 1,
  pull: 0
};

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
      },
      minPermission: {
        type: 'string',
        enum: ['admin', 'push', 'pull'],
        default: 'admin'
      }
    }
  },

  source: 'teams',

  check(cfg, repoTeams) {
    for (const team of repoTeams) {
      const hasReqPerm = PERMISSIONS[team.permission] >= PERMISSIONS[cfg.minPermission];
      const assigned = hasReqPerm && cfg.teams.indexOf(team.name) >= 0;
      if (assigned) return {valid: true};
    }

    return {
      valid: false,
      message: 'Repo not assigned to one of specified teams',
      messages: [`Specified teams: ${cfg.teams.join(', ')}`]
    };
  },

  issue: {
    title: 'Repo is not assigned to a team',
    comments: {
      create: 'Please add repo to the team',
      close: 'Repo added to the team, closing',
      reopen: 'Repo is not added to any team, probably removed. Please fix it'
    }
  }
};
