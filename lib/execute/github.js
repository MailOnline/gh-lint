'use status';

var rp = require('request-promise');

var github = module.exports = {
  getSource: {
    *meta (orgRepo, options) {
      options = options || {};
      return rp.get({
        uri: 'https://api.github.com/repos/' + orgRepo,
        json: true,
        user: options.user,
        pass: options.pass,
        headers: { 'User-Agent': 'gh-lint' }
      });
    }
  }
};
