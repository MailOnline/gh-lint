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

At the moment only rules for specific repositories are supported.


## License

[MIT](https://github.com/MailOnline/gh-lint/blob/master/LICENSE)
