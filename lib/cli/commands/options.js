'use strict';

const Ajv = require('ajv');
const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  jsonPointers: true
});


const DEFINITIONS = {
  stringOrArray: {
    anyOf: [
      { type: 'string' },
      {
        type: 'array',
        items: { type: 'string' }
      }
    ]
  }
};


module.exports = {
  check (schema, argv) {
    schema.definitions = DEFINITIONS;
    schema.properties._ = schema.properties._ || { maxItems: 1 };
    schema.additionalProperties = false;

    const valid = ajv.validate(schema, argv);
    if (valid) return null;
    let errors = '';
    ajv.errors.forEach(function (err) {
      errors += 'error: ';
      switch (err.keyword) {
        case 'required':
          errors += 'parameter ' + parameter(err.params.missingProperty) + ' is required';
          break;
        case 'additionalProperties':
          errors += 'parameter ' + parameter(err.params.additionalProperty) + ' is unknown';
          break;
        case 'maxItems':
          errors += 'invalid syntax (too many arguments)';
          break;
        default:
          errors += 'parameter ' + parameter(err.dataPath.slice(1)) + ' ' + err.message;
      }
      errors += '\n';
    });

    return errors;
  },

  get (argv) {
    const opts = {};
    const user = argv.u || argv.user;
    if (user) opts.user = user;
    const pass = argv.p || argv.pass;
    if (pass) opts.pass = pass;
    return opts;
  }
};


function parameter(str) {
  return (str.length == 1 ? '-' : '--') + str;
}
