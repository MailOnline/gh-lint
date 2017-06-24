'use strict';

module.exports = {
  meta: {
    name: 'commit-name',
    description: 'check that commit names satisfy semantic commit conventions',
    category: 'Commits',
    recommended: true
  },

  schema: {
    type: 'object',
    properties: {
      types: {
        type: 'array',
        minItems: 1,
        items: {type: 'string'},
        default: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
      },
      allowScope: {
        type: 'boolean',
        default: false
      },
      maxSubjectLength: {
        type: 'integer',
        default: 50
      },
      multiLine: {
        type: 'boolean',
        default: true
      },
      maxLineLength: {
        type: 'integer',
        default: 72
      },
      patterns: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          format: 'regex'
        }
      }
    }
  },

  source: 'commits',

  check(cfg, repoCommits) {
    const regexp = commitNameRegexp(cfg);
    let patterns = cfg.patterns && cfg.patterns.map((p) => new RegExp(p));
    let commits = [];

    for (const commit of repoCommits) {
      const msg = commit.commit.message;
      const valid = /^v?\d/.test(msg)
                    || /^Merge|^Initial|^Revert/.test(msg)
                    || (patterns && patterns.some((p) => p.test(msg)))
                    || regexp.test(msg);
      if (!valid) commits.push(commit);
    }

    if (commits.length == 0) return {valid: true};
    const allUsers = commits.map(users).join(', ');
    return {
      valid: false,
      message: `${commits.length} bad commit(s) by ${allUsers}`,
      messages: commits.map((c) => `Bad commit by ${users(c)}:\n${c.commit.message}`)
    };

    function users(cmt) {
      const author = user(cmt, 'author') || cmt.commit.author.name;
      const committer = user(cmt, 'committer') || cmt.commit.committer.name;
      if (author == committer) return author;
      if (author && committer) return `${author} and ${committer}`;
      return author || committer;
    }

    function user(cmt, userType) {
      return cmt[userType] && cmt[userType].login && ('@' + cmt[userType].login);
    }
  },

  issue: {
    title: 'Commit names do not satisfy requirements',
    comments: {
      create: 'Please use semantic commit names',
      close: 'All commit names satisfy requirements'
    }
  }
};


function commitNameRegexp(cfg) {
  let pattern = '^(?:' + cfg.types.join('|') + ')';
  if (cfg.allowScope) pattern += '\\([^\\r\\n]+\\)';
  pattern += `\\:[^\\r\\n]{1,${cfg.maxSubjectLength}}`;
  if (cfg.multiLine) pattern += `((?:\\r?\\n)+[^\\r\\n]{1,${cfg.maxLineLength}})*`;
  pattern += '$';

  return new RegExp(pattern);
}
