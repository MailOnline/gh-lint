'use strict';

const Ajv = require('ajv');
const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  jsonPointers: true,
  useDefaults: true
});


const DEFINITIONS = {
  dateTimeOrInt: {
    type: ['string', 'integer'],
    anyOf: [
      { format: 'date' },
      { format: 'date-time' }
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
    for (const err of ajv.errors) {
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
    }

    return errors;
  },

  get ({user, pass, after, before, since, until, tap, teamAccess}) {
    const opts = {
      after, before, tap, teamAccess,
      commits: {since, until}
    };
    if (user || pass) opts.auth = {user, pass};
    return opts;
  }
};


function parameter(str) {
  return (str.length == 1 ? '-' : '--') + str;
}
