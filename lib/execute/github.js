'use strict';

const rp = require('request-promise');

module.exports = {
  getSource: {
    meta (orgRepo, options={}) {
      return rp.get({
        uri: 'https://api.github.com/repos/' + orgRepo,
        json: true,
        auth: options.auth,
        headers: { 'User-Agent': 'gh-lint' }
      });
    }
  }
};
