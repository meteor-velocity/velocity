/*jshint -W117, -W097 */
"use strict";

Package.describe({
  name: 'velocity:core',
  summary: 'Velocity, a Meteor specific test-runner',
  version: '0.2.0',
  git: 'https://github.com/xolvio/velocity.git'
});

Npm.depends({
  'chokidar': '0.8.2',
  'lodash': '2.4.1',
  'glob': '3.2.9',
  'rsync': '0.3.0',
  'fs-extra': '0.10.0',
  'freeport': '1.0.2'
});

Package.on_use(function (api) {
  if (api.versionsFrom) {
    api.versionsFrom('METEOR@0.9.0');
    // This is required for Meteor.Collection since Meteor 0.9.1
    api.use('mongo');
  }

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
  api.export('VelocityMirrors', ['client', 'server']);

  api.add_files('main.js', 'server');
  api.add_files(['lib/FileCopier.js'], 'server');

  // Assets
  api.add_files([
    'default-fixture.js'
  ], 'server', {isAsset: true})
});
