'use strict';

const PERMISSIONS = {
  admin: 2,
  write: 1,
  read: 0
};

const TEAM_PERMISSIONS = {
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
        enum: ['admin', 'write', 'read'],
        default: 'admin'
      },
      singleTeam: {
        type: 'boolean',
        default: false
      }
    }
  },

  source: 'teams',

  check(cfg, repoTeams) {
    let teamsWithPerm = []
      , assigned;
    for (const team of repoTeams) {
      const hasReqPerm = TEAM_PERMISSIONS[team.permission] >= PERMISSIONS[cfg.minPermission];
      assigned = assigned || (hasReqPerm && cfg.teams.indexOf(team.name) >= 0);
      if (cfg.singleTeam) {
        if (hasReqPerm) teamsWithPerm.push(team.name);
      } else if (assigned) {
        return {valid: true};
      }
    }

    if (teamsWithPerm.length > 1) {
      const msg = `Repo has more than one team with permission "${cfg.minPermission}": ${teamsWithPerm.join(', ')}`;
      return {
        valid: false,
        message: msg,
        messages: [msg]
      };
    }

    if (assigned) return {valid: true};

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
