'use strict';

Package.describe({
  name: 'velocity:core',
  summary: 'Velocity, a Meteor specific test-runner',
  version: '0.10.0-rc.4',
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

  api.versionsFrom('METEOR@1.2.0.1');
  api.use('ecmascript');
  api.use('webapp');
  api.use('mongo');
  api.use('check');
  api.use('random');
  api.use('underscore'); // Used for the Function.bind polyfill
  api.use('velocity:chokidar@1.0.3_1', 'server');
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

  api.add_files('src/source_map_support.js', BOTH);
  api.add_files('src/polyfills.js', BOTH);
  api.add_files('src/globals.js', BOTH);
  api.add_files('src/collections.js', BOTH);
  api.add_files('src/helpers.js', SERVER);

  // Methods
  api.add_files('src/methods/logs/logs_reset.js', SERVER);
  api.add_files('src/methods/logs/logs_submit.js', SERVER);
  api.add_files('src/methods/mirrors/mirror_init.js', SERVER);
  api.add_files('src/methods/mirrors/mirror_register.js', SERVER);
  api.add_files('src/methods/mirrors/mirror_request.js', SERVER);
  api.add_files('src/methods/mirrors/parentHandshake.js', SERVER);
  api.add_files('src/methods/options/getOption.js', BOTH);
  api.add_files('src/methods/options/setOption.js', BOTH);
  api.add_files('src/methods/options/setOptions.js', BOTH);
  api.add_files('src/methods/reports/reports_completed.js', SERVER);
  api.add_files('src/methods/reports/reports_reset.js', SERVER);
  api.add_files('src/methods/reports/reports_submit.js', SERVER);
  api.add_files('src/methods/copySampleTests.js', SERVER);
  api.add_files('src/methods/featureTestDone.js', SERVER);
  api.add_files('src/methods/featureTestFailed.js', SERVER);
  api.add_files('src/methods/isEnabled.js', SERVER);
  api.add_files('src/methods/isMirror.js', SERVER);
  api.add_files('src/methods/register_framework.js', SERVER);
  api.add_files('src/methods/reset.js', SERVER);
  api.add_files('src/methods/returnTODOTestAndMarkItAsDOING.js', SERVER);
  api.add_files('src/methods.js', BOTH);

  api.add_files('src/core.js', SERVER);
  api.add_files('src/core-shared.js', BOTH);
  api.add_files('src/mirrors/mirrorRegistrar.js', SERVER);

});
