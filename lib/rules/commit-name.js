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
      }
    }
  },

  source: 'commits',

  check(cfg, repoCommits) {
    const regexp = commitNameRegexp(cfg);

    let messages = [];

    for (const {commit} of repoCommits) {
      const msg = commit.message;
      const valid = /^v?\d/.test(msg)
                    || /^Merge|^Initial/.test(msg)
                    || regexp.test(msg);
      if (!valid) messages.push(msg);
    }

    if (messages.length == 0) return {valid: true};
    return {
      valid: false,
      message: 'Bad commit names:\n' + messages.join('\n\n\n'),
      messages: messages.map((m) => `Bad commit name:\n${m}`)
    };
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
