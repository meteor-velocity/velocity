/*jshint -W117, -W030, -W016, -W084 */
/* global
 DEBUG:true
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

  var _ = Npm.require('lodash'),
      files = VelocityMeteorInternals.files,
      fs = Npm.require('fs-extra'),
      mkdirp = Meteor.wrapAsync(fs.mkdirp, fs),
      _config = {},
      _watcher,
      _velocityStarted = false,
      _velocityStartupFunctions = [],
      FIXTURE_REG_EXP = new RegExp('-fixture.(js|coffee)$');

  // Remove terminated mirrors from previous runs
  // This is needed for `meteor --test` to work properly
  VelocityMirrors.find({}).forEach(function (mirror) {
    try {
      process.kill(mirror.pid, 0);
    } catch (error) {
      VelocityMirrors.remove({pid: mirror.pid});
    }
  });

  if (process.env.NODE_ENV === 'development' &&
    process.env.VELOCITY !== '0' &&
    !process.env.IS_MIRROR
  ) {
    Meteor.startup(function initializeVelocity () {
      DEBUG && console.log('[velocity] Server startup');
      DEBUG && console.log('[velocity] app dir', Velocity.getAppPath());
      DEBUG && console.log('[velocity] config =', JSON.stringify(_config, null, 2));

      //kick-off everything
      _reset(_config);

      _initFileWatcher(_config, _triggerVelocityStartupFunctions);

      _launchContinuousIntegration(_config);

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
        func();
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
    getAppPath: function () {
      var appPath = files.findAppDir();
      if (appPath) {
        appPath = files.pathResolve(appPath);
      }

      return files.convertToOSPath(appPath);
    },


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
      _config[name] = _parseTestingFrameworkOptions(name, options);
      // make sure the appropriate aggregate records are added
      VelocityAggregateReports.insert({
        name: name,
        result: 'pending'
      });
    }

  });


//////////////////////////////////////////////////////////////////////
// Meteor Methods
//

  /**
   * Most communication with Velocity core is done via the following
   * Meteor methods.
   *
   * @class Meteor.methods
   */
  Meteor.methods({

    /**
     * Registers a testing framework plugin via a Meteor method.
     *
     * @method velocity/register/framework
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
    'velocity/register/framework': function (name, options) {
      options = options || {};
      check(name, String);
      check(options, {
        disableAutoReset: Match.Optional(Boolean),
        regex: Match.Optional(RegExp),
        sampleTestGenerator: Match.Optional(Function)
      });

      _config[name] = _parseTestingFrameworkOptions(name, options);

      // make sure the appropriate aggregate records are added
      _reset(_config);
    },


    /**
     * Re-init file watcher and clear all test results.
     *
     * @method velocity/reset
     */
    'velocity/reset': function () {
      _reset(_config);
    },

    /**
     * Clear all test results.
     *
     * @method velocity/reports/reset
     * @param {Object} [options]
     *   @param {String} [options.framework] The name of a specific framework
     *                    to clear results for.  Ex. 'jasmine' or 'mocha'
     *   @param {Array} [options.notIn] A list of test Ids which should be kept
     *                                  (not cleared).  These Ids must match the
     *                                  ones passed to `velocity/reports/submit`.
     */
    'velocity/reports/reset': function (options) {
      options = options || {};
      check(options, {
        framework: Match.Optional(String),
        notIn: Match.Optional([String])
      });

      var query = {};
      if (options.framework) {
        query.framework = options.framework;
        VelocityAggregateReports.upsert({name: options.framework}, {$set: {result: 'pending'}});
      }
      if (options.notIn) {
        query = _.assign(query, {_id: {$nin: options.notIn}});
      }
      VelocityTestReports.remove(query);

      _updateAggregateReports();
    },


    /**
     * Clear all log entries.
     *
     * @method velocity/logs/reset
     * @param {Object} [options]
     *   @param {String} [options.framework] The name of a specific framework
     *                                       to clear logs for.
     */
    'velocity/logs/reset': function (options) {
      options = options || {};
      check(options, {
        framework: Match.Optional(String)
      });

      var query = {};
      if (options.framework) {
        query.framework = options.framework;
      }
      VelocityLogs.remove(query);
    },


    /**
     * Log a message to the Velocity log store.  This provides a central
     * location for different reporters to query for test framework log
     * entries.
     *
     * @method velocity/logs/submit
     * @param {Object} options
     *   @param {String} options.framework The name of the test framework
     *   @param {String} options.message The message to log
     *   @param {String} [options.level] Log level.  Ex. 'error'. Default: 'info'
     *   @param {Date} [options.timestamp]
     */
    'velocity/logs/submit': function (options) {
      check(options, {
        framework: String,
        message: String,
        level: Match.Optional(String),
        timestamp: Match.Optional(Match.OneOf(Date, String))
      });

      VelocityLogs.insert({
        timestamp: options.timestamp ? new Date(options.timestamp) : new Date(),
        level: options.level || 'info',
        message: options.message,
        framework: options.framework
      });
    },


    /**
     * Record the results of an individual test run; a simple collector of
     * test data.
     *
     * The `data` object is stored in its entirety; any field may be passed in.
     * The optional fields documented here are suggestions based on what the
     * standard html-reporter supports.  Whether or not a field is actually
     * used is up to the specific test reporter that the user has installed.
     *
     * @method velocity/reports/submit
     * @param {Object} data
     *   @param {String} data.name Name of the test that was executed.
     *   @param {String} data.framework Name of a testing framework.
     *                                  For example, 'jasmine' or 'mocha'.
     *   @param {String} data.result The results of the test.  Standard values
     *                               are 'passed' and 'failed'.  Different test
     *                               reporters can support other values.  For
     *                               example, the aggregate tests collection uses
     *                               'pending' to indicate that results are still
     *                               coming in.
     *   @param {String} [data.id] Used to update a specific test result.  If not
     *                             provided, frameworks can use the
     *                             `velocity/reports/reset` Meteor method to
     *                             clear all tests.
     *   @param {Array} [data.ancestors] The hierarchy of suites and blocks above
     *                                   this test. For example,
     *                                ['Template', 'leaderboard', 'selected_name']
     *   @param {Date} [data.timestamp] The time that the test started for this
     *                                  result.
     *   @param {Number} [data.duration] The test duration in milliseconds.
     *   @param {String} [data.browser] Which browser did the test run in?
     *   @param {String} [data.failureType] For example, 'expect' or 'assert'
     *   @param {String} [data.failureMessage]
     *   @param {String} [data.failureStackTrace] The stack trace associated with
     *                                            the failure
     */
    'velocity/reports/submit': function (data) {
      check(data, Match.ObjectIncluding({
        name: String,
        framework: String,
        result: String,
        id: Match.Optional(String),
        ancestors: Match.Optional([String]),
        timestamp: Match.Optional(Match.OneOf(Date, String)),
        duration: Match.Optional(Number),
        browser: Match.Optional(String),
        failureType: Match.Optional(Match.Any),
        failureMessage: Match.Optional(String),
        failureStackTrace: Match.Optional(Match.Any)
      }));

      data.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
      data.id = data.id || Random.id();

      VelocityTestReports.upsert(data.id, {$set: data});

      _updateAggregateReports();
    },  // end postResult


    /**
     * Frameworks must call this method to inform Velocity they have completed
     * their current test runs. Velocity uses this flag when running in CI mode.
     *
     * @method velocity/reports/completed
     * @param {Object} data
     *   @param {String} data.framework Name of a test framework.  Ex. 'jasmine'
     */
    'velocity/reports/completed': function (data) {
      check(data, {
        framework: String
      });

      VelocityAggregateReports.upsert({'name': data.framework},
        {$set: {'result': 'completed'}});
      _updateAggregateReports();
    },  // end completed


    /**
     * Copy sample tests from frameworks `sample-tests` directories
     * to the user's application's `tests` directory.
     *
     * @method velocity/copySampleTests
     *
     * @param {Object} options
     *   @param {String} options.framework Framework name. Ex. 'jasmine', 'mocha'
     */
    'velocity/copySampleTests': function (options) {
      options = options || {};
      check(options, {
        framework: String
      });

      this.unblock();

      var sampleTestGenerator = _config[options.framework].sampleTestGenerator;
      if (sampleTestGenerator) {
        var sampleTests = sampleTestGenerator(options);

        DEBUG && console.log('[velocity] found ', sampleTests.length,
          'sample test files for', options.framework);

        sampleTests.forEach(function (testFile) {
          var fullTestPath = files.pathJoin(Velocity.getTestsPath(), testFile.path);
          var testDir = files.pathDirname(fullTestPath);
          mkdirp(files.convertToOSPath(testDir));
          files.writeFile(fullTestPath, testFile.contents);
        });
      }
    },  // end copySampleTests

    /**
     * Finds a test file with TODO status
     * changes the status to 'DOING', and returns it
     *
     * @method velocity/returnTODOTestAndMarkItAsDOING
     *
     * @param {Object} options
     *   @param {String} options.framework Framework name. Ex. 'jasmine', 'mocha'
     */
    'velocity/returnTODOTestAndMarkItAsDOING': function(options) {
      check(options, {
        framework: String
      });

      var _query = {
        targetFramework: options.framework,
        status: 'TODO'
      };

      var _update = {
        $set: {status: 'DOING'}
      };


      var collectionObj = VelocityTestFiles.rawCollection();
      var wrappedFunc = Meteor.wrapAsync(collectionObj.findAndModify,
        collectionObj);
      var _TODOtest = wrappedFunc(_query, {}, _update, {});

      return _TODOtest;
    },

    /**
     * Marks test file as DONE
     *
     * @method velocity/featureTestDone
     *
     * @param {Object} options
     *   @param {String} options.featureId id of test
     */
    'velocity/featureTestDone': function (options) {
      check(options, {
        featureId: String
      });

      VelocityTestFiles.update({
        _id: options.featureId
      }, {
        $set: {status: 'DONE'}
      });

    },

    /**
     * Marks test file as TODO
     *
     * @method velocity/featureTestFailed
     *
     * @param {Object} options
     *   @param {String} options.featureId id of test
     */
    'velocity/featureTestFailed': function (options) {
      check(options, {
        featureId: String
      });

      VelocityTestFiles.update({
        _id: options.featureId
      }, {
        $set: {status: 'TODO'}
      });

    }

  });  // end Meteor methods




//////////////////////////////////////////////////////////////////////
// Private functions
//

  function _triggerVelocityStartupFunctions () {
    _velocityStarted = true;
    DEBUG && console.log('[velocity] Triggering queued startup functions');
    var func;
    while (func = _velocityStartupFunctions.pop()) {
      func();
    }
  }

  function _parseTestingFrameworkOptions (name, options) {
    options = options || {};
    _.defaults(options, {
      name: name,
      regex: name + '/.+\\.js$'
    });

    options._regexp = new RegExp(options.regex);

    return options;
  }


  // Runs each test framework once when in continous integration mode.
  function _launchContinuousIntegration () {

    if (CONTINUOUS_INTEGRATION) {
      _.forEach(_getTestFrameworkNames(), function (testFramework) {
        Meteor.call('velocity/logs/reset', {framework: testFramework}, function () {

          Meteor.call(testFramework + '/reset', function () {});
          Meteor.call(testFramework + '/run', function () {});
        });
      });
    }
  }

  /**
   * Initialize the directory/file watcher.
   *
   * @method _initFileWatcher
   * @param {Object} config See {{#crossLink 'Velocity/registerTestingFramework:method'}}{{/crossLink}}
   * @param {function} callback  Called after the watcher completes its first scan and is ready
   * @private
   */
  function _initFileWatcher (config, callback) {

    VelocityTestFiles.remove({});
    VelocityFixtureFiles.remove({});

    var paths = [Velocity.getTestsPath()];

    var packagesPath = Velocity.getPackagesPath();
    if (VelocityInternals.isDirectory(packagesPath)) {
      var packageNames = files.readdir(packagesPath);
      var packageTestsPaths = _.chain(packageNames)
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
          targetFramework,
          data;

      filePath = files.convertToStandardPath(files.pathNormalize(filePath));
      relativePath = _getRelativePath(filePath);

      // if this is a fixture file, put it in the fixtures collection
      if (FIXTURE_REG_EXP.test(relativePath)) {
        DEBUG && console.log('[velocity] Found fixture file', relativePath);
        VelocityFixtureFiles.insert({
          _id: filePath,
          absolutePath: filePath,
          relativePath: relativePath,
          lastModified: Date.now()
        });
        // bail early
        return;
      }

      DEBUG && console.log('[velocity] Search framework for path', relativePath);

      var packageRelativePath = (relativePath.indexOf('packages') === 0) ?
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

        VelocityTestFiles.insert(data);
      } else {
        DEBUG && console.log('[velocity] No framework registered for', relativePath);
      }
    }));  // end watcher.on 'add'

    _watcher.on('change', Meteor.bindEnvironment(function (filePath) {
      DEBUG && console.log('[velocity] File changed:', _getRelativePath(filePath));

      // Since we key on filePath and we only add files we're interested in,
      // we don't have to worry about inadvertently updating records for files
      // we don't care about.
      VelocityTestFiles.update(filePath, {$set: {lastModified: Date.now()}});
    }));

    _watcher.on('unlink', Meteor.bindEnvironment(function (filePath) {
      DEBUG && console.log('[velocity] File removed:', _getRelativePath(filePath));
      VelocityTestFiles.remove(filePath);
    }));

    _watcher.on('ready', Meteor.bindEnvironment(function () {
      DEBUG && console.log('[velocity] File scan complete, now watching', Velocity.getTestsPath().substring(Velocity.getAppPath().length));
      if (callback) {
        callback();
      }
    }));

  }  // end _initFileWatcher

  function _isPackageWithTests(packageName) {
    return packageName !== 'tests-proxy' &&
      VelocityInternals.isDirectory(Velocity.getTestsPath(packageName));
  }

  /**
   * Re-init file watcher and clear all test results.
   *
   * @method _reset
   * @param {Object} config See {{#crossLink 'Velocity/registerTestingFramework:method'}}{{/crossLink}}
   * @private
   */
  function _reset (config) {

    DEBUG && console.log('[velocity] resetting the world');

    var frameworksWithDisableAutoReset = _(config).where({disableAutoReset: true}).pluck('name').value();
    DEBUG && console.log('[velocity] frameworks with disable auto reset:', frameworksWithDisableAutoReset);
    VelocityTestReports.remove({framework: {$nin: frameworksWithDisableAutoReset}});
    VelocityLogs.remove({framework: {$nin: frameworksWithDisableAutoReset}});
    VelocityAggregateReports.remove({});
    _.forEach(_getTestFrameworkNames(), function (testFramework) {
      VelocityAggregateReports.insert({
        name: testFramework,
        result: 'pending'
      });
    });

  }

  /**
   * If any one test has failed, mark the aggregate test result as failed.
   *
   * @method _updateAggregateReports
   * @private
   */
  function _updateAggregateReports () {

    VelocityAggregateReports.upsert({name: 'aggregateResult'}, {$set: {result: 'pending'}});
    VelocityAggregateReports.upsert({name: 'aggregateComplete'}, {$set: {result: 'pending'}});

    // if all of our test reports have valid results
    if (!VelocityTestReports.findOne({result: ''})) {

      // pessimistically set passed state, ensuring all other states take precedence in order below
      var aggregateResult =
            VelocityTestReports.findOne({result: 'failed'}) ||
            VelocityTestReports.findOne({result: 'undefined'}) ||
            VelocityTestReports.findOne({result: 'skipped'}) ||
            VelocityTestReports.findOne({result: 'pending'}) ||
            VelocityTestReports.findOne({result: 'passed'}) ||
            {result: 'pending'};

      // update the global status
      VelocityAggregateReports.update({'name': 'aggregateResult'}, {$set: {result: aggregateResult.result}});
    }

    // if all test frameworks have completed, upsert an aggregate completed record
    var completedFrameworksCount = VelocityAggregateReports.find({
      'name': {$in: _getTestFrameworkNames()},
      'result': 'completed'
    }).count();

    var aggregateComplete = VelocityAggregateReports.findOne({'name': 'aggregateComplete'});
    if (aggregateComplete) {
      if ((aggregateComplete.result !== 'completed') && (_getTestFrameworkNames().length === completedFrameworksCount)) {
        VelocityAggregateReports.update({'name': 'aggregateComplete'}, {$set: {'result': 'completed'}});
        _.each(Velocity.postProcessors, function (processor) {
          processor();
        });
      }
    }
  }

  function _getRelativePath (filePath) {
    var relativePath = filePath.substring(Velocity.getAppPath().length);
    if (relativePath[0] === '/') {
      relativePath = relativePath.substring(1);
    }
    return relativePath;
  }

  function _getTestFrameworkNames () {
    return _.pluck(_config, 'name');
  }

})();
