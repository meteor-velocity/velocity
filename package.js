/*jshint -W117, -W097 */
'use strict';

Package.describe({
  name: 'velocity:core',
  summary: 'Velocity, a Meteor specific test-runner',
  version: '1.0.0-rc.6',
  git: 'https://github.com/xolvio/velocity.git',
  debugOnly: true
});

Npm.depends({
  'chokidar': '0.10.1',
  'lodash': '2.4.1',
  'glob': '4.0.6',
  'mkdirp': '0.5.0',
  'fs-extra': '0.12.0'
});

Package.on_use(function (api) {

  var SERVER = 'server',
      CLIENT = 'client',
      BOTH = [CLIENT, SERVER];

  api.versionsFrom('METEOR@1.0');
  api.use('mongo');
  api.use('check');

  api.add_files('collections.js', BOTH);

  api.export('Velocity', BOTH);
  api.export('VelocityTestFiles', BOTH);
  api.export('VelocityTestReports', BOTH);
  api.export('VelocityAggregateReports', BOTH);
  api.export('VelocityLogs', BOTH);
  api.export('VelocityMirrors', BOTH);

  api.add_files('lib/meteor/files.js', SERVER);
  api.add_files('core.js', SERVER);

  api.add_files('mirrors/Mirror.js', SERVER);
  api.add_files('mirrors/mirrorRegistrar.js', SERVER);

});
