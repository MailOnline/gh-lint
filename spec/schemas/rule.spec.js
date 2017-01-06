module.exports = [
  {
    description: 'rule definition schema',
    schema: 'https://raw.githubusercontent.com/MailOnline/gitlint/master/lib/schemas/rule.json#',
    tests: [
      {
        description: 'a minimal valid rule',
        data: {
          meta: {
            description: 'Test rule',
            category: 'Test'
          },
          schema: {},
          sources: ['meta'],
          create: function() {}
        },
        valid: true
      }
    ]
  }
];
