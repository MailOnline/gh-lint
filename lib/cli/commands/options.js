'use strict';

const Ajv = require('ajv');
const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  jsonPointers: true
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

  get (argv) {
    const opts = {};
    const user = argv.u || argv.user;
    const pass = argv.p || argv.pass;
    if (user || pass) opts.auth = { user, pass };

    const after = argv.a || argv.after;
    const before = argv.b || argv.before;
    if (after) opts.after = getRangeDate(after);
    if (before) opts.before = getRangeDate(before);

    opts.commits = {since: getRangeDate(argv.since || 30)};
    if (argv.until) opts.commits.until = getRangeDate(argv.until);

    opts.tap = argv.tap;

    return opts;
  }
};


function parameter(str) {
  return (str.length == 1 ? '-' : '--') + str;
}

function getRangeDate(param) {
  return new Date(typeof param == 'string' ? param
                  : Date.now() - param * 86400000); // days
}
