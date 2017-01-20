'use strict';

var minimist = require('minimist');
var commands = require('./commands');
var options = require('./commands/options');

module.exports = (_argv) => {
  var argv = minimist(_argv);
  var command = argv._[0] || 'check';
  var cmd = commands[command];

  if (cmd) {
    var errors = options.check(cmd.schema, argv);
    if (errors) {
      console.error(errors);
      commands.help.usage();
      process.exit(2);
    } else {
      cmd.execute(argv)
      .then(
        () => process.exit(0),
        () => process.exit(1)
      );
    }
  } else {
    console.error('Unknown command', command);
    commands.help.usage();
    process.exit(2);
  }
};
