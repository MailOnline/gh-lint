'use strict';

const minimist = require('minimist');
const commands = require('./commands');
const options = require('./commands/options');

module.exports = (_argv, doExit) => {
  const argv = minimist(_argv, {
    alias: {
      config: 'c',
      user: 'u',
      pass: 'p',
      after: 'a',
      before: 'b',
      teamAccess: 'team-access'
    }
  });
  const command = argv._[0] || 'check';
  const cmd = commands[command];

  if (!cmd) {
    console.error('Unknown command', command);
    return invalidArgs();
  }

  const errors = options.check(cmd.schema, argv);
  if (errors) {
    console.error(errors);
    return invalidArgs();
  }

  const p = cmd.execute(argv);
  if (doExit === false) return p;
  p.then(exit(0), exit(1));


  function invalidArgs() {
    commands.help.usage();
    if (doExit === false) return Promise.reject();
    process.exit(2);
  }
};


function exit(code) {
  return () => process.exit(code);
}
