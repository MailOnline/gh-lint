'use strict';

var Ajv = require('ajv');
var ajv = Ajv({
  allErrors: true,
  coerceTypes: true,
  jsonPointers: true
});


module.exports = {
  check (schema, argv) {
    schema.definitions = DEFINITIONS;
    schema.properties._ = schema.properties._ || { maxItems: 1 };
    schema.additionalProperties = false;

    var valid = ajv.validate(schema, argv);
    if (valid) return null;
    var errors = '';
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
    var opts = {};
    var user = argv.u || argv.user;
    if (user) opts.user = user;
    var pass = argv.p || argv.pass;
    if (pass) opts.pass = pass;
    return opts;
  }
};


var DEFINITIONS = {
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


function parameter(str) {
  return (str.length == 1 ? '-' : '--') + str;
}
