'use strict';

var Ajv = require('ajv');
var jsonSchemaTest = require('json-schema-test');

var ajv = new Ajv({
  allErrors: true,
  verbose: true
});

require('ajv-keywords')(ajv, ['typeof']);

ajv.addSchema(require('../schemas/rule.json'));


jsonSchemaTest([ajv], {
  description: 'Schema tests',
  suites: {
    'tests': './schemas/{**/,}*.spec.js'
  },
  // afterError: after.error,
  // afterEach: after.each,
  cwd: __dirname,
  hideFolder: 'schemas/'
});
