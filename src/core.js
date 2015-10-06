/* globals
 DEBUG: true,
 CONTINUOUS_INTEGRATION: true
 */

DEBUG = !!process.env.VELOCITY_DEBUG;
CONTINUOUS_INTEGRATION = process.env.VELOCITY_CI;

/**
 * @module Velocity
 * @class Velocity
 */
(function () {
  'use strict';

//////////////////////////////////////////////////////////////////////
// Init
//

  DEBUG && console.log('[velocity] adding velocity core');
  CONTINUOUS_INTEGRATION && console.log('[velocity] is in continuous integration mode');

  var _ = Npm.require('lodash');
  var files = VelocityMeteorInternals.files;
  VelocityInternals.frameworkConfigs = {};
  var _watcher;
  var _velocityStarted = false;
  var _velocityStartupFunctions = [];
  var FIXTURE_REG_EXP = new RegExp('-fixture.(js|coffee)$');


  _removeTerminatedMirrors();

  _setReusableMirrors();

  if (process.env.NODE_ENV === 'development' &&
    process.env.VELOCITY !== '0' &&
    !process.env.IS_MIRROR
  ) {
    Meteor.startup(function () {
      Meteor.defer(function initializeVelocity () {
        DEBUG && console.log('[velocity] Server startup');
        DEBUG && console.log('[velocity] app dir', Velocity.getAppPath());
        DEBUG && console.log('[velocity] config =', JSON.stringify(VelocityInternals.frameworkConfigs, null, 2));

        //kick-off everything
        _resetAll();

        _initFileWatcher(VelocityInternals.frameworkConfigs, _triggerVelocityStartupFunctions);

      });
    });
  }

//////////////////////////////////////////////////////////////////////
// Public Methods
//

  _.extend(Velocity, {

    /**
     * Run code when Velocity is started.
     *
     * Velocity is considered started when the file watcher has
     * completed the scan of the file system.
     *
     * @method startup
     * @return {function} A function to run on startup
     */
    startup: function (func) {
      if (_velocityStarted) {
        DEBUG && console.log('[velocity] Velocity already started. Immediately calling func');
        Meteor.defer(func);
      } else {
        DEBUG && console.log('[velocity] Velocity not started. Queueing func');
        _velocityStartupFunctions.push(func);
      }
    },

    /**
     * Get the application root path.
     *
     * @method getAppPath
     * @return {String} app root path
     */
    getAppPath: _.memoize(function () {
      var appPath = files.findAppDir();
      if (appPath) {
        appPath = files.pathResolve(appPath);
      }

      return files.convertToOSPath(appPath);
    }),


    /**
     * Get path to application's or application package's 'tests' directory
     *
     * @method getTestsPath
     * @param {String} packageName optional package name
     * @return {String} application's tests directory
     */
    getTestsPath: function (packageName) {
      return files.convertToOSPath(
        files.pathJoin(packageName ? Velocity.getPackagePath(packageName) : Velocity.getAppPath(), 'tests')
      );
    },

    /**
     * Get path to application's 'packages' directory
     *
     * @method getPackagesPath
     * @return {String} application's packages directory
     */
    getPackagesPath: function () {
      return files.convertToOSPath(files.pathJoin(Velocity.getAppPath(), 'packages'));
    },

    /**
     * Get path to application's package directory
     *
     * @method getPackagesPath
     * @param {String} packageName package name
     * @return {String} application's packages directory
     */
    getPackagePath: function (packageName) {
      return files.convertToOSPath(files.pathJoin(Velocity.getPackagesPath(), packageName));
    },


    /**
     * A collection of callbacks to be executed after all tests have completed
     * and the aggregate test results have been reported.
     *
     * See {{#crossLink 'Velocity/addPostProcessor:method'}}{{/crossLink}}
     *
     * @property postProcessors
     * @type Array
     * @default []
     */
    postProcessors: [],

    /**
     * Add a callback which will execute after all tests have completed
     * and after the aggregate test results have been reported.
     *
     * @method addPostProcessor
     * @param {Function} processor
     */
    addPostProcessor: function (processor) {
      Velocity.postProcessors.push(processor);
    },

    /**
     * Get a message that displays where bugs in Velocity core itself should
     * be reported.
     *
     * @method getReportGithubIssueMessage
     * @return {String} message with bug repo url
     */
    getReportGithubIssueMessage: function () {
      return 'Please report the issue here: ' +
        'https://github.com/meteor-velocity/velocity/issues';
    },

    /**
     * Registers a testing framework plugin.
     *
     * @method registerTestingFramework
     * @param {String} name The name of the testing framework.
     * @param {Object} [options] Options for the testing framework.
     *   @param {String} [options.regex] The regular expression for test files
     *                    that should be assigned to the testing framework.
     *                    The path relative to the tests folder is matched
     *                    against it. Default: 'name/.+\.js$' (name is
     *                    the testing framework name).
     *   @param {String} [options.disableAutoReset]   Velocity's reset cycle
     *                    will skip reports and logs for this framework.
     *                    It is up to the framework to clean up its ****!
     *   @param {Function} [options.sampleTestGenerator] sampleTestGenerator
     *                    returns an array of fileObjects with the following
     *                    fields:
     *                      path - String - relative path to place test files
     *                                      (from PROJECT/tests)
     *                      contents - String - contents to put in the test file
     *                                          at the corresponding path
     */
    registerTestingFramework: function (name, options) {
      DEBUG && console.log('[velocity] Register framework ' + name + ' with regex ' + options.regex);
      VelocityInternals.frameworkConfigs[name] = VelocityInternals.parseTestingFrameworkOptions(name, options);
      // make sure the appropriate aggregate records are added
      Velocity.Collections.AggregateReports.insert({
        name: name,
        result: 'pending'
      });
    },

    /**
     * Unregister a testing framework.  Mostly used for internal testing
     * of core Velocity functions.
     *
     * @method unregisterTestingFramework
     * @param {String} name Name of framework to unregister
     */
    unregisterTestingFramework: function (name) {
      Velocity.Collections.TestReports.remove({framework: name});
      Velocity.Collections.Logs.remove({framework: name});
      Velocity.Collections.AggregateReports.remove({name: name});
      Velocity.Collections.TestFiles.remove({targetFramework: name});

      delete VelocityInternals.frameworkConfigs[name];
    }
  });


//////////////////////////////////////////////////////////////////////
// Private functions
//

  function _triggerVelocityStartupFunctions () {
    _velocityStarted = true;
    DEBUG && console.log('[velocity] Triggering queued startup functions');

    while (_velocityStartupFunctions.length) {
      var func = _velocityStartupFunctions.pop();
      Meteor.defer(func);
    }
  }

   VelocityInternals.parseTestingFrameworkOptions = function (name, options) {
    options = options || {};
    _.defaults(options, {
      name: name,
      regex: name + '/.+\\.js$'
    });

    options._regexp = new RegExp(options.regex);

    return options;
  };

  /**
   * Initialize the directory/file watcher.
   *
   * @method _initFileWatcher
   * @param {Object} config See {{#crossLink 'Velocity/registerTestingFramework:method'}}{{/crossLink}}
   * @param {function} callback  Called after the watcher completes its first scan and is ready
   * @private
   */
  function _initFileWatcher (config, callback) {
    var paths,
        packagesPath;

    Velocity.Collections.TestFiles.remove({});
    Velocity.Collections.FixtureFiles.remove({});

    paths = [Velocity.getTestsPath()];
    packagesPath = Velocity.getPackagesPath();

    if (VelocityInternals.isDirectory(packagesPath)) {
      var packageNames = files.readdir(packagesPath),
          packageTestsPaths = _.chain(packageNames)
            .filter(_isPackageWithTests)
            .map(Velocity.getTestsPath)
            .value();
      paths.push.apply(paths, packageTestsPaths);
    }

    paths = _.map(paths, files.convertToOSPath);

    DEBUG && console.log('[velocity] Add paths to watcher', paths);

    _watcher = chokidar.watch(paths, {
      ignored: /[\/\\](\.|node_modules)/,
      persistent: true
    });
    _watcher.on('add', Meteor.bindEnvironment(function (filePath) {
      var relativePath,
          packageRelativePath,
          targetFramework,
          data;

      filePath = files.convertToStandardPath(files.pathNormalize(filePath));
      relativePath = _getRelativePath(filePath);

      // if this is a fixture file, put it in the fixtures collection
      if (FIXTURE_REG_EXP.test(relativePath)) {
        DEBUG && console.log('[velocity] Found fixture file', relativePath);
        Velocity.Collections.FixtureFiles.insert({
          _id: filePath,
          absolutePath: filePath,
          relativePath: relativePath,
          lastModified: Date.now()
        });
        // bail early
        return;
      }

      DEBUG && console.log('[velocity] Search framework for path', relativePath);

      packageRelativePath = (relativePath.indexOf('packages') === 0) ?
        relativePath.split('/').slice(2).join('/') :
        relativePath;

      // test against each test framework's regexp matcher, use first one that matches
      targetFramework = _.find(config, function (framework) {
        return framework._regexp.test(packageRelativePath);
      });

      if (targetFramework) {
        DEBUG && console.log('[velocity] Target framework for', relativePath, 'is', targetFramework.name);

        data = {
          _id: filePath,
          name: files.pathBasename(filePath),
          absolutePath: filePath,
          relativePath: relativePath,
          targetFramework: targetFramework.name,
          lastModified: Date.now()
        };

        Velocity.Collections.TestFiles.insert(data);
      } else {
        DEBUG && console.log('[velocity] No framework registered for', relativePath);
      }
    }));  // end watcher.on 'add'

    _watcher.on('change', Meteor.bindEnvironment(function (filePath) {
      DEBUG && console.log('[velocity] File changed:', _getRelativePath(filePath));

      // Since we key on filePath and we only add files we're interested in,
      // we don't have to worry about inadvertently updating records for files
      // we don't care about.
      filePath = files.convertToStandardPath(files.pathNormalize(filePath));
      Velocity.Collections.TestFiles.update(filePath, {$set: {lastModified: Date.now()}});
    }));

    _watcher.on('unlink', Meteor.bindEnvironment(function (filePath) {
      filePath = files.convertToStandardPath(files.pathNormalize(filePath));
      DEBUG && console.log('[velocity] File removed:',
        _getRelativePath(filePath));

      Velocity.Collections.TestFiles.remove(filePath);
    }));

    _watcher.on('ready', Meteor.bindEnvironment(function () {
      DEBUG && console.log('[velocity] File scan complete, now watching',
        Velocity.getTestsPath().substring(Velocity.getAppPath().length));

      callback && callback();
    }));

  }  // end _initFileWatcher


  function _isPackageWithTests(packageName) {
    return packageName !== 'tests-proxy' &&
      VelocityInternals.isDirectory(Velocity.getTestsPath(packageName));
  }


  /**
   * Clear test reports, aggregate reports, and logs for a specific framework.
   *
   * @method VelocityInternals.reset
   * @param {String} name Framework to reset
   */
  VelocityInternals.reset = function (name) {
    DEBUG && console.log('[velocity] resetting', name);

    Velocity.Collections.Logs.remove({framework: name});
    Velocity.Collections.TestReports.remove({framework: name});
    Velocity.Collections.AggregateReports.remove({name: name});

    Velocity.Collections.AggregateReports.insert({
      name: name,
      result: 'pending'
    });
  };

  /**
   * Clear all test reports, aggregate reports, and logs.
   *
   * @method _resetAll
   * @param {Object} config See {{#crossLink 'Velocity/registerTestingFramework:method'}}{{/crossLink}}
   * @private
   */
  function _resetAll () {
    var allFrameworks,
        frameworksToIgnore;

    DEBUG && console.log('[velocity] resetting the world');

    allFrameworks = _getTestFrameworkNames();

    // ignore frameworks that have opted-out
    frameworksToIgnore = _(VelocityInternals.frameworkConfigs)
      .where({disableAutoReset: true})
      .pluck('_resetAllname')
      .value();

    DEBUG && console.log('[velocity] frameworks with disable auto reset:',
      frameworksToIgnore);

    Velocity.Collections.AggregateReports.remove({});
    Velocity.Collections.Logs.remove({framework: {$nin: frameworksToIgnore}});
    Velocity.Collections.TestReports.remove({framework: {$nin: frameworksToIgnore}});

    _.forEach(allFrameworks, function (testFramework) {
      Velocity.Collections.AggregateReports.insert({
        name: testFramework,
        result: 'pending'
      });
    });
  }


  /**
   * If any one test has failed, mark the aggregate test result as failed.
   *
   * @method VelocityInternals.updateAggregateReports
   */
  VelocityInternals.updateAggregateReports = function  () {
    var aggregateResult,
        completedFrameworksCount,
        allFrameworks = _getTestFrameworkNames();

    Velocity.Collections.AggregateReports.upsert({name: 'aggregateResult'},
      {$set: {result: 'pending'}});
    Velocity.Collections.AggregateReports.upsert({name: 'aggregateComplete'},
      {$set: {result: 'pending'}});

    // if all of our test reports have valid results
    if (!Velocity.Collections.TestReports.findOne({result: ''})) {

      // pessimistically set passed state, ensuring all other states
      // take precedence in order below
      aggregateResult =
        Velocity.Collections.TestReports.findOne({result: 'failed'}) ||
        Velocity.Collections.TestReports.findOne({result: 'undefined'}) ||
        Velocity.Collections.TestReports.findOne({result: 'skipped'}) ||
        Velocity.Collections.TestReports.findOne({result: 'pending'}) ||
        Velocity.Collections.TestReports.findOne({result: 'passed'}) ||
        {result: 'pending'};

      // update the global status
      Velocity.Collections.AggregateReports.update({name: 'aggregateResult'},
        {$set: {result: aggregateResult.result}});
    }


    // Check if all test frameworks have completed successfully
    completedFrameworksCount = Velocity.Collections.AggregateReports.find({
      name: {$in: allFrameworks},
      result: 'completed'
    }).count();

    if (allFrameworks.length === completedFrameworksCount) {
      Velocity.Collections.AggregateReports.update({name: 'aggregateComplete'},
        {$set: {'result': 'completed'}});
      _.each(Velocity.postProcessors, function (processor) {
        processor();
      });
    }
  };

  function _getRelativePath (filePath) {
    var relativePath = filePath.substring(Velocity.getAppPath().length);

    if (relativePath[0] === '/') {
      relativePath = relativePath.substring(1);
    }
    return relativePath;
  }

  function _getTestFrameworkNames () {
    return _.pluck(VelocityInternals.frameworkConfigs, 'name');
  }

  function _removeTerminatedMirrors() {
    // Remove terminated mirrors from previous runs
    // This is needed for `meteor --test` to work properly
    Velocity.Collections.Mirrors.find({}).forEach(function(mirror) {
      try {
        process.kill(mirror.pid, 0);
      } catch (error) {
        Velocity.Collections.Mirrors.remove({pid: mirror.pid});
      }
    });
  }

  function _setReusableMirrors() {
    Velocity.reusableMirrors = [];
    Velocity.Collections.Mirrors.find({}).forEach(function(mirror) {
      mirror.reused = false;
      Velocity.reusableMirrors.push(mirror);
    });
  }

})();
