'use strict';

module.exports = {
  execute: execute,
  usage: usage,
  schema: {
    type: 'object',
    properties: {
      _: { maxItems: 2 }
    }
  }
};


const commands = {
  check: helpCheck
};


function execute(argv) {
  const command = argv._[1];
  if (!command || command == 'help') {
    mainHelp();
    return Promise.resolve();
  }

  const cmdHelp = commands[command];

  if (cmdHelp) {
    cmdHelp();
    return Promise.resolve();
  }

  console.error('Unknown command', command);
  usage();
  return Promise.reject();
}


function usage() {
  console.error(
`usage:
    check:  ghlint [check] -c config.json

    help:      ghlint help
               ghlint help <command>`);
}


function mainHelp() {
  _helpCheck();
  console.log(
`More information:
        ghlint help check`);
}


function helpCheck() {
  _helpCheck();
  console.log(
`parameters
    -c configuration file, see docs

options:
    -u or --user=   GitHub username
    -p or --pass=   GitHub access token
    -a or --after=  only check repositories updated after this date/time
    -b or --before= only check repositories updated before this date/time
    --tap           output results in TAP format`);
}


function _helpCheck() {
  console.log(
`Check repositiories against rules
    ghlint [check] -c config.json`);
}
