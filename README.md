# gh-lint
Rule-based command-line tool for monitoring GitHub repositories

[![Build Status](https://travis-ci.org/MailOnline/gh-lint.svg?branch=master)](https://travis-ci.org/MailOnline/gh-lint)
[![npm version](https://badge.fury.io/js/gh-lint.svg)](https://www.npmjs.com/package/gh-lint)
[![Coverage Status](https://coveralls.io/repos/MailOnline/gh-lint/badge.svg?branch=master&service=github)](https://coveralls.io/github/MailOnline/gh-lint?branch=master)


## Install

```bash
npm install -g gh-lint
```


## Usage

```bash
ghlint -c config.json -u $GITHUB_USERNAME -p $GITHUB_TOKEN
```

where config.json is a configuration file described by [this schema](https://github.com/MailOnline/gh-lint/blob/master/schemas/config.json).

You can define rules for organisations, teams and specific repos.


## Rules

#### Repo rules

- repo-description: check that repo has description specified in GitHub UI
- repo-homepage: check that repo has homepage specified in GitHub UI
- repo-team: check that repo is assigned to one of specified teams


#### Branch rules

- branch-default: check that default branch is master
- branch-protection: check that master branch is protected


## Options

- `-c` (or `--config`) - configuration file location
- `-u` (or `--user`) - GitHub username.
- `-p` (or `--pass`) - GitHub password.
- `-a` (or `--after`) / `-b` (or `--before`) - only validate repositories in organizations and in teams that were changed **after**/**before** this date (also can be date-time or the integer number of days). These options have no effect on repositories that are explicitely specified.
- `--tap` - output results in TAP format


## License

[MIT](https://github.com/MailOnline/gh-lint/blob/master/LICENSE)
