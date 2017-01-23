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
  console.error('\
usage:\n\
    check:  ghlint [check] -c config.json\n\
\n\
    help:      ghlint help\n\
               ghlint help <command>');
}


function mainHelp() {
  _helpCheck();
  console.log('\
More information:\n\
        ghlint help check');
}


function helpCheck() {
  _helpCheck();
  console.log('\
parameters\n\
    -c configuration file, see docs \n\
\n\
options:\n\
    -u or --user=   GitHub username\n\
    -p or --pass=   GitHub access token');
}


function _helpCheck() {
  console.log('\
Check repositiories against rules\n\
    ghlint [check] -c config.json');
}
