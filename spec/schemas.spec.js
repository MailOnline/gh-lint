'use strict';

const Ajv = require('ajv');
const jsonSchemaTest = require('json-schema-test');

const ajv = new Ajv({
  allErrors: true,
  verbose: true
});

require('ajv-keywords')(ajv, ['typeof', 'patternRequired']);

ajv.addSchema(require('../schemas/defs.json'));
ajv.addSchema(require('../schemas/rule.json'));
ajv.addSchema(require('../schemas/config.json'));
ajv.addSchema(require('../schemas/plugin.json'));


jsonSchemaTest([ajv], {
  description: 'Schema tests',
  suites: {
    'tests': './schemas/{**/,}*.spec.{js,json}'
  },
  // afterError: after.error,
  // afterEach: after.each,
  cwd: __dirname,
  hideFolder: 'schemas/'
});
