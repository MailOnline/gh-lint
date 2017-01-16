module.exports = [
  {
    description: 'rule definition schema',
    schema: 'https://raw.githubusercontent.com/MailOnline/gh-lint/master/schemas/rule.json#',
    tests: [
      {
        description: 'a minimal valid rule',
        data: {
          meta: {
            description: 'Test rule',
            category: 'Test'
          },
          schema: {},
          source: 'meta',
          check: {
            type: 'object',
            required: ['description'],
            properties: {
              description: {
                type: 'string',
                minLength: 15
              }
            }
          }
        },
        valid: true
      }
    ]
  }
];
