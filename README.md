# gh-lint

[![Greenkeeper badge](https://badges.greenkeeper.io/MailOnline/gh-lint.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/MailOnline/gh-lint.svg?branch=master)](https://travis-ci.org/MailOnline/gh-lint)
[![npm version](https://badge.fury.io/js/gh-lint.svg)](https://www.npmjs.com/package/gh-lint)
[![Coverage Status](https://coveralls.io/repos/MailOnline/gh-lint/badge.svg?branch=master&service=github)](https://coveralls.io/github/MailOnline/gh-lint?branch=master)


## Contents

- [Install](#install)
- [Usage](#usage)
- [Rules](#rules)
  - [Repo rules](#repo-rules)
  - [Branch rules](#branch-rules)
  - [Commit rules](#commit-rules)
  - [PR rules](#pr-rules)
- [Options](#options)
- [Plugins](#plugins)
- [License](#license)


## Why gh-lint?

When you agree on some development guidelines, you need to know when they are not followed.

Most major open-source projects have adopted some automation to validate contribution guidelines. With **gh-lint** you can validate guidelines in public and private repositories across multiple organisations using pre-defined and custom rules.

See the talk about the development guidelines and **gh-lint** at FullStack 2017: [video](https://skillsmatter.com/skillscasts/10399-auditing-development-guidelines-in-github-repositories) and [slides](https://www.slideshare.net/epoberezkin/auditing-development-guidelines-in-github-repositories).


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

**gh-lint** can generate output in TAP format (with option `--tap`) that can be consumed by [tap-github-issues](https://github.com/MailOnline/tap-github-issues) to open, close and update issues in the GitHub repositories where the rules are checked.

See [gh-lint-demo](https://github.com/MailOnline/gh-lint-demo) for the example configuration and the scripts to run **gh-lint** and **tap-github-issues**.


## Rules

#### Repo rules

- repo-description: check that repo has description specified in GitHub UI
- repo-homepage: check that repo has homepage specified in GitHub UI
- repo-readme: check that repo has README file
- repo-team: check that repo is assigned to one of specified teams
- repo-admin-team: check repo admin team(s)


#### Branch rules

- branch-default: check that default branch is master
- branch-protection: check that master branch is protected


#### Commit rules

By default, these rules analyse the commits for the last 30 days. It can be changed using options `--since` and `--until` (see below).

- commit-name: check that commit names satisfy semantic commit conventions
- commit-pr: check that commit was added to master via PR
- commit-user: check that commit is associated with some GitHub user(s)


#### PR rules

By default, these rules analyse the PRs for the last 30 days. It can be changed using option `--since` (see below).

- pr-review: check that all PRs have at least one review that approved them


## Options

- `-c` (or `--config`) - configuration file location
- `-u` (or `--user`) - GitHub username
- `-p` (or `--pass`) - GitHub password
- `-t` (or `--team-permission`) - minimal team permission level required for repo to be associated with the team (for team-specific rules). The default is "admin". Other values are "push" (includes admin access) and "pull" (repo will be associated with the team that has any access level).
- `-a` (or `--after`) / `-b` (or `--before`) - only validate repositories in organizations and in teams that were changed **after**/**before** this date (also can be date-time or the integer number of days). These options have no effect on repositories that are explicitely specified.
- `--since` / `--until` - validate commits **since**/**until** this date (also can be date-time or the integer number of days)
- `--tap` - output results in TAP format


## Plugins

Rules can be defined in external modules.

The package name must be prefixed with "ghlint-plugin-". In the configuration file a plugin name can be used with or without this prefix.

A plugin package should export an object with a single property "rules" that has a map of rule definitions. Each rule should be valid according to the [rule schema](https://github.com/MailOnline/gh-lint/blob/master/schemas/rule.json).


## License

[MIT](https://github.com/MailOnline/gh-lint/blob/master/LICENSE)
