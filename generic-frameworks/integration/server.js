/*jshint -W030, -W020, -W117 */

(function () {

  'use strict';

  if (process.env.NODE_ENV !== 'development' || process.env.IS_MIRROR ||
    process.env.VELOCITY === '0') {
    return;
  }

  var path = Npm.require('path'),
      FRAMEWORK_NAME = 'generic-integration',
      FRAMEWORK_REGEX = FRAMEWORK_NAME + '/.+\\.js$';

  if (Velocity && Velocity.registerTestingFramework) {
    Velocity.registerTestingFramework(FRAMEWORK_NAME, {
      regex: FRAMEWORK_REGEX,
      sampleTestGenerator: _getSampleTestFiles
    });
  }

  function _getSampleTestFiles () {
    return [{
      path: path.join(FRAMEWORK_NAME, 'sample.js'),
      contents: Assets.getText(path.join('sample-tests', 'sample.js'))
    }];
  }

  Meteor.startup(function () {

    Meteor.call('velocity/reports/reset', {framework: FRAMEWORK_NAME}, function () {

      Meteor.call('velocity/mirrors/request', {
        framework: 'generic-integration'
      });

      var init = function () {
        VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).observe({
          added: _rerunTests,
          removed: _rerunTests,
          changed: _rerunTests
        });
      };

      var initOnce = _.once(Meteor.bindEnvironment(init));
      VelocityMirrors.find({framework: 'generic-integration', state: 'ready'}).observe({
        added: initOnce,
        changed: initOnce
      });
    });

  });

  Meteor.methods({
    pretendTests: function (options) {
      Meteor.call('velocity/reports/submit', {
        id: 'GenericFramework' + options.type + 'Test',
        framework: FRAMEWORK_NAME,
        name: 'Generic Framework ' + options.type + ' Test',
        result: options.result,
        ancestors: [],
        duration: 10,
        error_message: 0,
        failureType: 0,
        failureStackTrace: 0
      }, function () {
        Meteor.call('velocity/reports/completed', {framework: FRAMEWORK_NAME});
      });
    }
  });

  function _rerunTests () {

  }


})();


