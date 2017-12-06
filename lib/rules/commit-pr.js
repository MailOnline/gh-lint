'use strict';

const {plural, uniques, user, users} = require('./util');

module.exports = {
  meta: {
    name: 'commit-pr',
    description: 'check that commit was added to master via PR',
    category: 'Commits',
    recommended: true
  },

  schema: {
    excludeCommitters: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string'
      }
    }
  },

  source: 'commits',

  async check(cfg, repoCommits, orgRepo, github) {
    const repoPRs = await github.getSource.prs(orgRepo);
    let prCommits = [];
    let mergeCommitShas = [];
    for (const pr of repoPRs) {
      if (pr.state != 'closed') continue;
      const prUrl = `/repos/${orgRepo}/pulls/${pr.number}`;
      const prMeta = await github.get(prUrl);
      if (!prMeta.merged) continue;
      const commits = await github.allPages(`${prUrl}/commits`);
      prCommits = prCommits.concat(commits);
      mergeCommitShas.push(prMeta.merge_commit_sha);
    }

    const exclCommitters = cfg.excludeCommitters;
    const commits = [];
    for (const cmt of repoCommits) {
      const excluded = exclCommitters && exclCommitters.indexOf(user(cmt, 'committer')) >= 0;
      if (!excluded && !belongsToPR(cmt))
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

    function isRebased({commit: c}) {
      return prCommits.findIndex(
        ({commit: c1}) => c.message == c1.message
                          && c.author.email == c1.author.email
                          && c.tree.sha == c1.tree.sha
      ) >= 0;
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
