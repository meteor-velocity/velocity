(function () {

  'use strict';

  Package.describe({
    name: 'velocity:generic-integration-framework',
    summary: 'Generic integration testing framework for testing Velocity',
    version: '0.0.0',
    debugOnly: true
  });

  Npm.depends({
  });

  Package.onUse(function (api) {

    api.use([
      'underscore@1.0.2',
      'velocity:core'
    ], ['server', 'client']);
    api.use([
      'velocity:html-reporter@0.4.1'
    ], 'client');

    api.add_files([
      'sample-tests/sample.js',
    ], 'server', {isAsset: true});

    api.addFiles(['server.js'], 'server');

  });

})
();
