'use strict';

module.exports = {
  meta: {
    name: 'branch-protection',
    description: 'check that master branch is protected',
    category: 'Branch',
    recommended: true
  },

  schema: {
    type: 'object',
    properties: {
      branches: {
        type: 'array',
        items: {type: 'string'},
        uniqueItems: true,
        default: ['master']
      }
    }
  },

  source: 'branches',

  async check(cfg, repoBranches, orgRepo, github) {
    const brs = [];
    for (const branch of cfg.branches) {
      if (repoBranches.findIndex(b => b.name == branch) == -1) continue;
      const branchUrl = `/repos/${orgRepo}/branches/${branch}`;
      const branchMeta = await github.get(branchUrl);
      if (!branchMeta.protected) brs.push(branchMeta);
    }

    if (brs.length == 0) return {valid: true};
    const allBranches = brs.map(b => b.name).join(', ');
    return {
      valid: false,
      message: `Unprotected branch${plural(brs)}: ${allBranches}`,
      messages: brs.map(b => `Unprotected branch ${b.name}`)
    };

    function plural(arr) {
      return arr.length > 1 ? 'es' : '';
    }
  },

  issue: {
    title: 'Branches are not protected',
    comments: {
      create: 'Please enable branch protection',
      close: 'Branch protection enabled, closing',
      reopen: 'Branches are not protected, probably removed. Please fix it'
    }
  }
};
