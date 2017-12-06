'use strict';

module.exports = {
  meta: {
    name: 'commit-pr',
    description: 'check that commit was added to master via PR',
    category: 'Commits',
    recommended: true
  },

  schema: {},

  source: 'commits',

  async check(cfg, repoCommits, orgRepo, github) {
    const repoPRs = await github.getSource.prs(orgRepo);
    let prCommits = [];
    let mergeCommitShas = [];
    for (const pr of repoPRs) {
      const prMeta = await github.get(`/repos/${orgRepo}/pulls/${pr.number}`);
      if (!prMeta.merged_at) continue;
      const commits = await github.allPages(`/repos/${orgRepo}/pulls/${pr.number}/commits`);
      prCommits = prCommits.concat(commits);
      mergeCommitShas.push(prMeta.merge_commit_sha);
    }

    const commits = [];
    for (const cmt of repoCommits) {
      if (!belongsToPR(cmt))
        commits.push(cmt);
    }

    if (commits.length == 0) return {valid: true};
    const allUsers = uniques(commits.map(users)).join(', ');
    return {
      valid: false,
      message: `${commits.length} commit${plural(commits)} without PR by ${allUsers}`,
      messages: commits.map((c) => `Commit without PR by ${users(c)}:\n${c.html_url}\n${c.commit.message}`)
    };

    function belongsToPR(cmt) {
      return isMergeCommit(cmt)
              || isMerged(cmt)
              || isRebased(cmt);
    }

    function isMergeCommit(cmt) {
      return mergeCommitShas.indexOf(cmt.sha) >= 0;
    }

    function isMerged(cmt) {
      return prCommits.find(c => c.sha == cmt.sha) >= 0;
    }

    function isRebased(cmt) {
      return prCommits.findIndex(c => {
        return c.commit.message == cmt.commit.message
                && c.commit.tree.sha == cmt.commit.tree.sha
                && c.parents.length == cmt.parents.length
                && c.parents.every((p, i) => p.sha == cmt.parents[i].sha);
      }) >= 0;
    }

    function users(cmt) {
      const a = user(cmt, 'author');
      const c = user(cmt, 'committer');
      if (a && c && a != c) return `${a} and ${c}`;
      return a || c;
    }

    function user(cmt, userType) {
      return cmt[userType] && cmt[userType].login
              ? '@' + cmt[userType].login
              : cmt.commit[userType].name;
    }

    function uniques(arr) {
      return arr.sort().filter((item, i) => !(i && item == arr[i-1]));
    }

    function plural(arr) {
      return arr.length > 1 ? 's' : '';
    }
  },

  issue: {
    title: 'Commits to master are made without PR',
    remind: false,
    comments: {
      create: 'Please make commits to master only via PRs',
      close: 'All recent commits to master are made via PRs'
    }
  }
};
