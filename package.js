'use strict';

Package.describe({
  name: 'velocity:core',
  summary: 'Velocity, a Meteor specific test-runner',
  version: '0.10.4',
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

  api.versionsFrom('METEOR@1.2.0.2');
  api.use('ecmascript');
  api.use('webapp');
  api.use('mongo');
  api.use('check');
  api.use('random');
  api.use('underscore'); // Used for the Function.bind polyfill
  api.use('velocity:chokidar@1.2.0_1', 'server');
  api.use('velocity:meteor-internals@1.1.0_7');
  api.use('velocity:source-map-support@0.3.2_1');
  api.use('sanjo:long-running-child-process@1.1.3', 'server');
  api.use('sanjo:meteor-files-helpers@1.1.0_7', 'server');

  api.export('Velocity', BOTH);
  api.export('VelocityTestFiles', BOTH);
  api.export('VelocityFixtureFiles', BOTH);
  api.export('VelocityTestReports', BOTH);
  api.export('VelocityAggregateReports', BOTH);
  api.export('VelocityLogs', BOTH);
  api.export('VelocityMirrors', BOTH);
  api.export('VelocityOptions', BOTH);

  api.addFiles('src/source_map_support.js', BOTH);
  api.addFiles('src/polyfills.js', BOTH);
  api.addFiles('src/globals.js', BOTH);
  api.addFiles('src/collections.js', BOTH);
  api.addFiles('src/helpers.js', SERVER);

  // Methods
  api.addFiles('src/methods/logs/logs_reset.js', SERVER);
  api.addFiles('src/methods/logs/logs_submit.js', SERVER);
  api.addFiles('src/methods/mirrors/mirror_init.js', SERVER);
  api.addFiles('src/methods/mirrors/mirror_register.js', SERVER);
  api.addFiles('src/methods/mirrors/mirror_request.js', SERVER);
  api.addFiles('src/methods/mirrors/parentHandshake.js', SERVER);
  api.addFiles('src/methods/options/getOption.js', BOTH);
  api.addFiles('src/methods/options/setOption.js', BOTH);
  api.addFiles('src/methods/options/setOptions.js', BOTH);
  api.addFiles('src/methods/reports/reports_completed.js', SERVER);
  api.addFiles('src/methods/reports/reports_reset.js', SERVER);
  api.addFiles('src/methods/reports/reports_submit.js', SERVER);
  api.addFiles('src/methods/copySampleTests.js', SERVER);
  api.addFiles('src/methods/featureTestDone.js', SERVER);
  api.addFiles('src/methods/featureTestFailed.js', SERVER);
  api.addFiles('src/methods/isEnabled.js', SERVER);
  api.addFiles('src/methods/isMirror.js', SERVER);
  api.addFiles('src/methods/register_framework.js', SERVER);
  api.addFiles('src/methods/reset.js', SERVER);
  api.addFiles('src/methods/returnTODOTestAndMarkItAsDOING.js', SERVER);
  api.addFiles('src/methods.js', BOTH);

  api.addFiles('src/core.js', SERVER);
  api.addFiles('src/core-shared.js', BOTH);
  api.addFiles('src/mirrors/mirrorRegistrar.js', SERVER);

});
