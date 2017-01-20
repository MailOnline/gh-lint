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


var commands = {
  check: helpCheck
};

var OK = Promise.resolve();
var FAIL = Promise.reject();


function execute(argv) {
  var command = argv._[1];
  if (!command || command == 'help') {
    mainHelp();
    return OK;
  }

  var cmdHelp = commands[command];

  if (cmdHelp) {
    cmdHelp();
    return OK;
  }

  console.error('Unknown command', command);
  usage();
  return FAIL;
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
    -s JSON schema to validate against (required, only one schema allowed)\n\
    -d data file(s) to be validated (required)\n\
    -r referenced schema(s)\n\
    -m meta schema(s)\n\
    -c custom keywords/formats definitions\n\
\n\
    -d, -r, -m, -c can be globs and can be used multiple times\n\
    glob should be enclosed in double quotes\n\
    -c module(s) should export a function that accepts Ajv instance as parameter\n\
    (file path should start with ".", otherwise used as require package)\n\
    .json extension can be omitted (but should be used in globs)\n\
\n\
options:\n\
    --errors=          error reporting format ("js" by deafult)\n\
    --changes=         log changes in data after validation ("no" by default)\n\
             js        JavaScript object\n\
             json      JSON format\n\
             line      JSON single line\n\
             text      text message (only for --errors option)\n\
             no        don\'t log errors');
}


function _helpCheck() {
    console.log('\
Check repositiories against rules\n\
    ghlint [check] -c config.json');
}
