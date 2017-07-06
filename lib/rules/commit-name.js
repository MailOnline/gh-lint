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
      excludePatterns: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          format: 'regex'
        }
      },
      excludeAuthors: {
        description: 'each author can be either author name as saved in git commit\
                      or GitHub username of commit author starting with @',
        type: 'array',
        minItems: 1,
        items: {
          type: 'string'
        }
      }
    }
  },

  source: 'commits',

  check(cfg, repoCommits) {
    const regexp = commitNameRegexp(cfg);
    let exclPatterns = cfg.excludePatterns && cfg.excludePatterns.map((p) => new RegExp(p));
    const exclAuthors = cfg.excludeAuthors;
    let commits = [];

    for (const commit of repoCommits) {
      const msg = commit.commit.message;
      const valid = /^v?\d/.test(msg)
                    || /^Merge|^Initial|^Revert/.test(msg)
                    || (exclPatterns && exclPatterns.some((p) => p.test(msg)))
                    || (exclAuthors && exclAuthors.indexOf(user(commit, 'author')) >= 0)
                    || regexp.test(msg);
      if (!valid) commits.push(commit);
    }

    if (commits.length == 0) return {valid: true};
    const allUsers = uniques(commits.map(users)).join(', ');
    return {
      valid: false,
      message: `${commits.length} bad commit name${plural(commits)} by ${allUsers}`,
      messages: commits.map((c) => `Bad commit name by ${users(c)}:\n${c.html_url}\n${c.commit.message}`)
    };

    function users(cmt) {
      const author = user(cmt, 'author');
      const committer = user(cmt, 'committer');
      if (author == committer) return author;
      if (author && committer) return `${author} and ${committer}`;
      return author || committer;
    }

    function user(cmt, userType) {
      return cmt[userType] && cmt[userType].login && ('@' + cmt[userType].login) || cmt.commit[userType].name;
    }

    function uniques(arr) {
      return arr.sort().filter((item, i) => !(i && item == arr[i-1]));
    }

    function plural(arr) {
      return arr.length > 1 ? 's' : '';
    }
  },

  issue: {
    title: 'Commit names do not satisfy requirements',
    remind: false,
    comments: {
      create: 'Please use semantic commit names',
      close: 'All commit names satisfy requirements'
    }
  }
};


function commitNameRegexp(cfg) {
  let pattern = '^(?:' + cfg.types.join('|') + ')';
  if (cfg.allowScope) pattern += '\\([^\\r\\n]+\\)';
  pattern += `\\:\\s[^\\r\\n]{1,${cfg.maxSubjectLength}}`;
  if (cfg.multiLine) pattern += `((?:\\r?\\n)+[^\\r\\n]{1,${cfg.maxLineLength}})*`;
  pattern += '$';

  return new RegExp(pattern);
}
