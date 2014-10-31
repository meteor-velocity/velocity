/*jshint -W117, -W097 */
"use strict";

Package.describe({
  name: 'velocity:core',
  summary: 'Velocity, a Meteor specific test-runner',
  version: '1.0.0-rc.2',
  git: 'https://github.com/xolvio/velocity.git',
  debugOnly: true
});

Npm.depends({
  'chokidar': '0.8.2',
  'lodash': '2.4.1',
  'glob': '3.2.9',
  'mkdirp': "0.5.0",
  'rsync': '0.3.0',
  'fs-extra': '0.12.0',
  'freeport': '1.0.2'
});

Package.on_use(function (api) {

  var SERVER = 'server',
      CLIENT = 'client',
      BOTH = [CLIENT, SERVER];

  api.versionsFrom('METEOR@1.0');
  api.use('mongo');
  api.use('check');
  api.use('http');
  api.use('retry');

  api.add_files('collections.js', BOTH);

  api.export('Velocity', BOTH);
  api.export('VelocityTestFiles', BOTH);
  api.export('VelocityFixtureFiles', BOTH);
  api.export('VelocityTestReports', BOTH);
  api.export('VelocityAggregateReports', BOTH);
  api.export('VelocityLogs', BOTH);
  api.export('VelocityMirrors', BOTH);

  api.add_files('lib/meteor/files.js', SERVER);
  api.add_files('core.js', SERVER);
  api.add_files(['lib/FileCopier.js'], SERVER);
  api.add_files('clientFileSync.js', CLIENT);

  // Assets
  api.add_files([
    'default-fixture.js'
  ], SERVER, {isAsset: true});
});
