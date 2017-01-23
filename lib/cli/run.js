'use strict';

const minimist = require('minimist');
const commands = require('./commands');
const options = require('./commands/options');

module.exports = (_argv) => {
  const argv = minimist(_argv);
  const command = argv._[0] || 'check';
  const cmd = commands[command];

  if (!cmd) {
    console.error('Unknown command', command);
    commands.help.usage();
    process.exit(2);
  }

  const errors = options.check(cmd.schema, argv);
  if (errors) {
    console.error(errors);
    commands.help.usage();
    process.exit(2);
  }

  cmd.execute(argv).then(exit(0), exit(1));
};


function exit(code) {
  return () => process.exit(code);
}
