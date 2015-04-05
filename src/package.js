/*jshint -W117, -W097 */
'use strict';

Package.describe({
  name: 'velocity:core',
  summary: 'Velocity, a Meteor specific test-runner',
  version: '0.5.1',
  git: 'https://github.com/meteor-velocity/velocity.git',
  debugOnly: true
});

Npm.depends({
  'chokidar': '0.11.1',
  'lodash': '2.4.1',
  'mkdirp': '0.5.0',
  'fs-extra': '0.12.0',
  'freeport':'1.0.4',
  'mongodb-uri': '0.9.7'
});

Package.on_use(function (api) {

  var SERVER = 'server',
      CLIENT = 'client',
      BOTH = [CLIENT, SERVER];

  api.versionsFrom('METEOR@1.0');
  api.use('mongo');
  api.use('check');
  api.use('velocity:meteor-internals@1.1.0_4');
  api.use('sanjo:long-running-child-process@1.0.3', 'server');

  api.export('Velocity', BOTH);
  api.export('VelocityTestFiles', BOTH);
  api.export('VelocityFixtureFiles', BOTH);
  api.export('VelocityTestReports', BOTH);
  api.export('VelocityAggregateReports', BOTH);
  api.export('VelocityLogs', BOTH);
  api.export('VelocityMirrors', BOTH);
  api.export('VelocityOptions', BOTH);

  api.add_files('globals.js', BOTH);
  api.add_files('collections.js', BOTH);
  api.add_files('helpers.js', SERVER);
  api.add_files('core.js', SERVER);
  api.add_files('core-shared.js', BOTH);

  api.add_files('mirrors/Mirror.js', SERVER);
  api.add_files('mirrors/mirrorRegistrar.js', SERVER);

});
