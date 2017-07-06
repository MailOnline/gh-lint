'use strict';

module.exports = {
  meta: {
    name: 'pr-approved',
    description: 'check that all merged PRs have been approved',
    category: 'PRs',
    recommended: true
  },

  schema: {},

  source: 'prs',

  async check(cfg, repoPRs, orgRepo, github) {
    const prs = [];
    for (const pr of repoPRs) {
      if (pr.state != 'closed') continue;
      const prUrl = `/repos/${orgRepo}/pulls/${pr.number}`;
      const prMeta = await github.get(prUrl);
      if (!prMeta.merged_at) continue;
      const reviews = await github.allPages(`${prUrl}/reviews`);
      if (!reviews.some(approved)) prs.push(prMeta);
    }

    if (prs.length == 0) return {valid: true};
    const allUsers = uniques(prs.map(user)).join(', ');
    return {
      valid: false,
      message: `${prs.length} unapproved PR${plural(prs)} merged by ${allUsers}`,
      messages: prs.map((p) => `Unapproved PR merged by ${user(p)}:\n${p.html_url}\n${p.title}`)
    };

    function approved(review) {
      return review.state.toLowerCase() == 'approved';
    }

    function user(pr) {
      return '@' + pr.merged_by.login;
    }

    function uniques(arr) {
      return arr.sort().filter((item, i) => !(i && item == arr[i-1]));
    }

    function plural(arr) {
      return arr.length > 1 ? 's' : '';
    }
  },

  issue: {
    title: 'PRs should be approved before merging',
    remind: false,
    comments: {
      create: 'Please ask for PR reviews',
      close: 'All merged PRs that were checked are approved'
    }
  }
};
