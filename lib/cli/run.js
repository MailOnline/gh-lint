'use strict';

const minimist = require('minimist');
const commands = require('./commands');
const options = require('./commands/options');

module.exports = (_argv) => {
  const argv = minimist(_argv);
  const command = argv._[0] || 'check';
  const cmd = commands[command];

  if (cmd) {
    const errors = options.check(cmd.schema, argv);
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
