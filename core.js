/*jshint -W117, -W030, -W016 */
/* global
 Velocity:true,
 DEBUG:true
 */

DEBUG = !!process.env.VELOCITY_DEBUG;

/**
 * @module Velocity
 */
/**
 * The `Velocity` object provides a common API for test frameworks to report
 * test results.  Frameworks can also request assets, such as a copy of the
 * user's application (the 'mirror') in which tests can be safely run without
 * impacting on-going development.
 *
 * Test results and log activity are reported via
 * {{#crossLink "Meteor.methods"}}Meteor methods{{/crossLink}}.
 *
 * @class Velocity
 */
Velocity = {};

(function () {
  'use strict';

//////////////////////////////////////////////////////////////////////
// Init
//

  if (process.env.NODE_ENV !== 'development' ||
    process.env.VELOCITY === '0' ||
    process.env.IS_MIRROR) {
    DEBUG && console.log('[velocity] ' + (process.env.IS_MIRROR ? 'Mirror detected - ' : '') + 'Not adding velocity core');
    return;
  }

  var getAssetPath = function (packageName, fileName) {
    var serverAssetsPath = path.join(
      findAppDir(), '.meteor', 'local', 'build', 'programs', 'server', 'assets'
    );

    packageName = packageName.replace(':', '_');

    return path.join(serverAssetsPath, 'packages', packageName, fileName);
  };

  var _ = Npm.require('lodash'),
      fs = Npm.require('fs'),
      path = Npm.require('path'),
      child_process = Npm.require('child_process'),
      chokidar = Npm.require('chokidar'),
      mkdirp = Npm.require('mkdirp'),
      _config = {},
      _watcher;


  Meteor.startup(function initializeVelocity () {
    DEBUG && console.log('[velocity] Server startup');
    DEBUG && console.log('[velocity] app dir', Velocity.getAppPath());
    DEBUG && console.log('velocity config =', JSON.stringify(_config, null, 2));

    // kick-off everything
    _reset(_config);
  });

//////////////////////////////////////////////////////////////////////
// Public Methods
//

  _.extend(Velocity, {

    /**
     * Get application directory path.
     *
     * @method getAppPath
     * @return {String} app directory path
     */
    getAppPath: function () {
      return findAppDir();
    },


    /**
     * Get path to application's 'tests' directory
     *
     * @method getTestsPath
     * @return {String} application's tests directory
     */
    getTestsPath: function () {
      return path.join(Velocity.getAppPath(), 'tests');
    },

    /**
     * Add a callback which will execute after all tests have completed
     * and after the aggregate test results have been reported.
     *
     * @method addPostProcessor
     * @param {Function} processor
     */
    postProcessors: [],
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
     * @param {String} name                       The name of the testing framework.
     * @param {Object} [options]                  Options for the testing framework.
     * @param {String} options.disableAutoReset   Velocity's reset cycle will skip reports and logs for this framework
     *                                            It will be the responsibility of the framework to clean up its ****!
     * @param {String} options.regex              The regular expression for test files that should be assigned
     *                                            to the testing framework.
     *                                            The path relative to the tests
     *                                            folder is matched against it.
     *                                            The default is "name/.+\.js$"
     *                                            (name is the testing framework name).
     * @param options.sampleTestGenerator {Function} sampleTestGenerator
     *    returns an array of fileObjects with the following fields:
     * @param options.sampleTestGenerator.path {String} relative path to place test file (from PROJECT/tests)
     * @param options.sampleTestGenerator.contents {String} contents of the test file the path that's returned
     */
    registerTestingFramework: function (name, options) {
      _config[name] = _parseTestingFrameworkOptions(name, options);

      // make sure the appropriate aggregate records are added
      _reset(_config);
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
     * @param {String} [options.framework] The name of a specific framework
     *                  to clear results for.  Ex. 'jasmine' or 'mocha'
     * @param {Array} [options.notIn] A list of test Ids which should be kept
     *                                (not cleared).  These Ids must match the
     *                                ones passed to `velocity/reports/submit`.
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
     * @param {String} [options.framework] The name of a specific framework
     *                                     to clear logs for.
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
     * @param {String} options.framework The name of the test framework
     * @param {String} options.message The message to log
     * @param {String} [options.level] Log level.  Ex. 'error'. Default: 'info'
     * @param {Date} [options.timestamp]
     */
    'velocity/logs/submit': function (options) {
      check(options, {
        framework: String,
        message: String,
        level: Match.Optional(String),
        timestamp: Match.Optional(Match.OneOf(Date, String))
      });

      VelocityLogs.insert({
        timestamp: options.timestamp || new Date(),
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
     * @param {String} data.name Name of the test that was executed.
     * @param {String} data.framework Name of a testing framework.
     *                                For example, 'jasmine' or 'mocha'.
     * @param {String} data.result The results of the test.  Standard values
     *                             are 'passed' and 'failed'.  Different test
     *                             reporters can support other values.  For
     *                             example, the aggregate tests collection uses
     *                             'pending' to indicate that results are still
     *                             coming in.
     * @param {String} [data.id] Used to update a specific test result.  If not
     *                           provided, frameworks can use the
     *                           `velocity/reports/reset` Meteor method to
     *                           clear all tests.
     * @param {Array} [data.ancestors] The hierarchy of suites and blocks above
     *                                 this test. For example,
     *                              ['Template', 'leaderboard', 'selected_name']
     * @param {Date} [data.timestamp] The time that the test started for this
     *                                result.
     * @param {Number} [data.duration] The test duration in milliseconds.
     * @param {String} [data.browser] Which browser did the test run in?
     * @param {String} [data.failureType] For example, 'expect' or 'assert'
     * @param {String} [data.failureMessage]
     * @param {String} [data.failureStackTrace] The stack trace associated with
     *                                          the failure
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
        failureType: Match.Optional(String),
        failureMessage: Match.Optional(String),
        failureStackTrace: Match.Optional(Match.Any)
      }));

      data.timestamp = data.timestamp || new Date();
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
     * @param {String} data.framework Name of a test framework.  Ex. 'jasmine'
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
     * @param {String} options.framework Framework name. Ex. 'jasmine', 'mocha'
     */
    'velocity/copySampleTests': function (options) {
      var sampleTests,
          samplesPath,
          testsPath,
          command;

      options = options || {};
      check(options, {
        framework: String
      });

      if (_config[options.framework].sampleTestGenerator) {

        sampleTests = _config[options.framework].sampleTestGenerator(options);

        DEBUG && console.log('[velocity] found ', sampleTests.length,
          'sample test files for', options.framework);

        sampleTests.forEach(function (testFile) {
          var fullTestPath = path.join(Velocity.getTestsPath(), testFile.path);
          var testDir = path.dirname(fullTestPath);
          mkdirp.sync(testDir);
          fs.writeFileSync(fullTestPath, testFile.contents);
        });

      } else {

        samplesPath = path.join(Velocity.getAppPath(), 'packages',
          options.framework, 'sample-tests');
        testsPath = Velocity.getTestsPath();

        DEBUG && console.log('[velocity] checking for sample tests in',
          path.join(samplesPath, '*'));

        if (fs.existsSync(samplesPath)) {
          command = 'mkdir -p ' + testsPath + ' && ' +
          'rsync -au ' + path.join(samplesPath, '*') +
          ' ' + testsPath + path.sep;

          DEBUG && console.log('[velocity] copying sample tests (if any) ' +
            'for framework', options.framework, '-',
            command);

          child_process.exec(command, Meteor.bindEnvironment(
            function copySampleTestsExecHandler (err, stdout, stderr) {
              if (err) {
                console.error('ERROR', err);
              }
              console.log(stdout);
              console.error(stderr);
            },
            'copySampleTestsExecHandler'
          ));
        }

      }
    }  // end copySampleTests



  });  // end Meteor methods




//////////////////////////////////////////////////////////////////////
// Private functions
//



  function _parseTestingFrameworkOptions (name, options) {
    options = options || {};
    _.defaults(options, {
      name: name,
      regex: name + '\\' + path.sep + '.+\\.js$'
    });

    options._regexp = new RegExp(options.regex);

    return options;
  }

  /**
   * Initialize the directory/file watcher.
   *
   * @method _initWatcher
   * @param {Object} config  See `registerTestingFramework`.
   * @private
   */
  function _initWatcher (config) {

    _watcher = chokidar.watch(Velocity.getTestsPath(), {ignored: /[\/\\]\./});

    _watcher.on('add', Meteor.bindEnvironment(function (filePath) {
      var relativePath,
          targetFramework,
          data;

      filePath = path.normalize(filePath);

      DEBUG && console.log('File added:', filePath);

      relativePath = filePath.substring(Velocity.getAppPath().length);
      if (relativePath[0] === path.sep) {
        relativePath = relativePath.substring(1);
      }

      // test against each test framework's regexp matcher, use first
      // one that matches
      targetFramework = _.find(config, function (framework) {
        return framework._regexp.test(relativePath);
      });

      if (targetFramework) {
        DEBUG && console.log(targetFramework.name, ' <= ', filePath);

        data = {
          _id: filePath,
          name: path.basename(filePath),
          absolutePath: filePath,
          relativePath: relativePath,
          targetFramework: targetFramework.name,
          lastModified: Date.now()
        };

        VelocityTestFiles.insert(data);
      }
    }));  // end watcher.on 'add'

    _watcher.on('change', Meteor.bindEnvironment(function (filePath) {
      DEBUG && console.log('File changed:', filePath);

      // Since we key on filePath and we only add files we're interested in,
      // we don't have to worry about inadvertently updating records for files
      // we don't care about.
      VelocityTestFiles.update(filePath, {$set: {lastModified: Date.now()}});
    }));

    _watcher.on('unlink', Meteor.bindEnvironment(function (filePath) {
      DEBUG && console.log('File removed:', filePath);
      // If we only remove the file, we also need to remove the test results for
      // just that file. This required changing the postResult API and we could
      // do it, but the brute force method of reset() will do the trick until we
      // want to optimize VelocityTestFiles.remove(filePath);
      _reset(config);
    }));

  }  // end _initWatcher

  /**
   * Re-init file watcher and clear all test results.
   *
   * @method _reset
   * @param {Object} config  See `registerTestingFramework`.
   * @private
   */
  function _reset (config) {

    DEBUG && console.log('[velocity] resetting the world');

    if (_watcher) {
      _watcher.close();
    }

    VelocityTestFiles.remove({});
    var frameworksWithDisableAutoReset = _(config).where({disableAutoReset: true}).pluck('name').value();
    DEBUG && console.log('[velocity] not resetting reports and logs for', frameworksWithDisableAutoReset);
    VelocityTestReports.remove({framework: {$nin: frameworksWithDisableAutoReset}});
    VelocityLogs.remove({framework: {$nin: frameworksWithDisableAutoReset}});
    VelocityAggregateReports.remove({});
    VelocityAggregateReports.insert({
      name: 'aggregateResult',
      result: 'pending'
    });
    VelocityAggregateReports.insert({
      name: 'aggregateComplete',
      result: 'pending'
    });
    _.forEach(_getTestFrameworkNames(), function (testFramework) {
      VelocityAggregateReports.insert({
        name: testFramework,
        result: 'pending'
      });
    });

    _initWatcher(config);
  }

  /**
   * If any one test has failed, mark the aggregate test result as failed.
   *
   * @method _updateAggregateReports
   * @private
   */
  function _updateAggregateReports () {

    var failedResult,
        frameworkResult;

    // if all of our test reports have valid results
    if (!VelocityTestReports.findOne({result: ''})) {
      // look through them and see if we find any tests that failed
      failedResult = VelocityTestReports.findOne({result: 'failed'});

      // if any tests failed, set the framework as failed; otherwise set our framework to passed
      frameworkResult = failedResult ? 'failed' : 'passed';

      // update the global status
      VelocityAggregateReports.update({'name': 'aggregateResult'}, {$set: {result: frameworkResult}});
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

  function _getTestFrameworkNames () {
    return _.pluck(_config, 'name');
  }

})();
