(function () {

  'use strict';

  Package.describe({
    name: 'velocity:generic-framework',
    summary: 'Generic integration testing framework for testing Velocity',
    version: '0.0.0',
    debugOnly: true
  });

  Npm.depends({
  });

  Package.onUse(function (api) {

    api.use([
      'grigio:babel@0.1.6',
      'underscore@1.0.2',
      'velocity:core',
      'velocity:shim@0.1.0'
    ], ['server', 'client']);
    api.use([
      'velocity:html-reporter@0.4.1'
    ], 'client');

    api.addAssets([
      'sample-tests/sample.js'
    ], 'server');

    api.addFiles(['server.es6.js'], 'server');

  });

})
();
