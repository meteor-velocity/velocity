/*jshint -W117, -W097 */
'use strict';

Package.describe({
  name: 'velocity:core',
  summary: 'Velocity, a Meteor specific test-runner',
  version: '0.6.1',
  git: 'https://github.com/meteor-velocity/velocity.git',
  debugOnly: true
});

Npm.depends({
  'lodash': '2.4.1',
  'fs-extra': '0.18.0',
  'freeport':'1.0.4',
  'mongodb-uri': '0.9.7',
  'colors': '1.0.3',
  'tmp': '0.0.25'
});

Package.on_use(function (api) {

  var SERVER = 'server',
      CLIENT = 'client',
      BOTH = [CLIENT, SERVER];

  api.versionsFrom('METEOR@1.1.0.2');
  api.use('webapp');
  api.use('mongo');
  api.use('check');
  api.use('velocity:chokidar@1.0.1_1', 'server');
  api.use('velocity:meteor-internals@1.1.0_7');
  api.use('sanjo:long-running-child-process@1.0.3', 'server');
  api.use('sanjo:meteor-files-helpers@1.1.0_4', 'server');

  api.export('Velocity', BOTH);
  api.export('VelocityTestFiles', BOTH);
  api.export('VelocityFixtureFiles', BOTH);
  api.export('VelocityTestReports', BOTH);
  api.export('VelocityAggregateReports', BOTH);
  api.export('VelocityLogs', BOTH);
  api.export('VelocityMirrors', BOTH);
  api.export('VelocityOptions', BOTH);

  api.add_files('src/globals.js', BOTH);
  api.add_files('src/collections.js', BOTH);
  api.add_files('src/helpers.js', SERVER);
  api.add_files('src/core.js', SERVER);
  api.add_files('src/core-shared.js', BOTH);

  api.add_files('src/mirrors/Mirror.js', SERVER);
  api.add_files('src/mirrors/mirrorRegistrar.js', SERVER);

});

Package.onTest(function(api) {
  api.use('sanjo:jasmine@0.13.0');
  api.use('velocity:core');
  api.addFiles('tests/server/VelocitySpec.js', 'server');
});
