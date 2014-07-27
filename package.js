Package.describe({
  summary: 'Velocity, a Meteor specific test-runner'
});

Npm.depends({
  'chokidar': '0.8.2',
  'lodash': '2.4.1',
  'glob': '3.2.9',
  'rsync': '0.3.0',
<<<<<<< HEAD
  'fs.extra': '1.2.1',
  'freeport': '1.0.2',
  'istanbul': '0.3.0',
  'ibrik': '1.1.1'
=======
  'fs-extra': '0.10.0',
  'freeport': '1.0.2'
>>>>>>> b128f920a519a4f741f5eb3fc1b4e6bd5bc3ffed
});

Package.on_use(function (api) {
  api.use('check');
  api.use('http');
  api.use('retry');

  api.add_files('collections.js', ['client', 'server']);

  api.export('Velocity', ['client', 'server']);
  api.export('VelocityTestFiles', ['client', 'server']);
  api.export('VelocityFixtureFiles', ['client', 'server']);
  api.export('VelocityTestReports', ['client', 'server']);
  api.export('VelocityAggregateReports', ['client', 'server']);
  api.export('VelocityLogs', ['client', 'server']);

  api.add_files('main.js', 'server');
  api.add_files(['lib/FileCopier.js'], 'server');
  api.add_files(['lib/Instrumenter.js'], 'server');
});
