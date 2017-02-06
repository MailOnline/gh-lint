"use strict";

const github = require('../../lib/execute/github');
const repos = require('../fixtures/mailonline_expected_reponames.json');
const co = require('co');
const fs = require('fs');
const path = require('path');

co(function *() {
  var repos = yield github.getRepos.organization('milojs');
  console.log(JSON.stringify(repos, null, 2));
  // for (const repo of repos) {
  //   const meta = yield github.getSource.meta('milojs/' + repo.name);
  //   fs.writeFileSync(path.join(__dirname, '..', 'fixtures', 'milojs_repos', repo.name + '.json'), JSON.stringify(meta, null, 2));
  //   console.log(repo.name);
  // }
  return 'done';
}).then(console.log);
