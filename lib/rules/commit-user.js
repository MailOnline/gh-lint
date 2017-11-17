'use strict';

module.exports = {
  meta: {
    name: 'commit-user',
    description: 'check that commit author and commiter have associated GitHub user login',
    category: 'Commits',
    recommended: true
  },

  schema: {},

  source: 'commits',

  check(cfg, repoCommits) {
    const commits = [];
    for (const commit of repoCommits) {
      const {author: a, committer: c} = commit;
      if (!(a && a.login && c && c.login)) commits.push(commit);
    }

    if (commits.length == 0) return {valid: true};
    const allUsers = uniques(commits.map(users)).join(', ');
    return {
      valid: false,
      message: `${commits.length} commit${plural(commits)} not linked to GitHub user accounts: ${allUsers}`,
      messages: commits.map((c) => `Commit by ${users(c)} not linked to GitHub user account:\n${c.html_url}\n${c.commit.message}`)
    };

    function users(cmt) {
      const a = user(cmt, 'author');
      const c = user(cmt, 'committer');
      if (a && c && a != c) return `${a} and ${c}`;
      return a || c;
    }

    function user(cmt, userType) {
      const _user = cmt[userType];
      if (!(_user && _user.login)) return cmt.commit[userType].name;
    }

    function uniques(arr) {
      return arr.sort().filter((item, i) => !(i && item == arr[i-1]));
    }

    function plural(arr) {
      return arr.length > 1 ? 's' : '';
    }
  },

  issue: {
    title: 'Commits are not associated with GitHub users',
    remind: false,
    comments: {
      create: 'Please set up your email address in git and in GitHub profile (https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/)',
      close: 'All checked commits are associated with GitHub users'
    }
  }
};
