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

  // This methods must be also available in the mirror
  Meteor.methods({
    /**
     * Exposes the IS_MIRROR flag to clients
     *
     * @method velocity/isMirror
     * @return {Boolean} true if currently running in mirror
     */
    'velocity/isMirror': function () {
      return !!process.env.IS_MIRROR;
    }
  })

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

  var escapeShellArgument = function (argument) {
    if (!/(["'`\\ ])/.test(argument)) {
      return argument;
    } else {
      return '"' + argument.replace(/(["'`\\])/g, '\\$1') + '"';
    }
  }

  var _ = Npm.require('lodash'),
      fs = Npm.require('fs'),
      fse = Npm.require('fs-extra'),
      outputFile = Meteor.wrapAsync(fse.outputFile),
      copyFile = Meteor.wrapAsync(fse.copy),
      path = Npm.require('path'),
      url = Npm.require('url'),
      Rsync = Npm.require('rsync'),
      child_process = Npm.require('child_process'),
      chokidar = Npm.require('chokidar'),
      mkdirp = Npm.require('mkdirp'),
      _config = {},
      _preProcessors = [],
      _postProcessors = [],
      _watcher,
      FIXTURE_REG_EXP = new RegExp('-fixture.(js|coffee)$'),
      DEFAULT_FIXTURE_PATH = getAssetPath('velocity:core', 'default-fixture.js'),
      MIRROR_PID_VAR_TEMPLATE = 'mirror.@PORT.pid';

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
     * Get path to directory of the 'mirror' application.
     *
     * @method getMirrorPath
     * @return {String} mirror directory path
     */
    getMirrorPath: function () {
      return path.join(Velocity.getAppPath(), '.meteor', 'local', '.mirror');
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
     * Add a callback which will execute when the mirror application
     * is sync'ed up with latest application code.  Preprocessors will
     * execute before fixtures are added.
     *
     * @method addPreProcessor
     * @param {Function} preprocessor
     */
    addPreProcessor: function (preProcessor) {
      _preProcessors.push(preProcessor);
    },

    /**
     * Add a callback which will execute after all tests have completed
     * and after the aggregate test results have been reported.
     *
     * @method addPostProcessor
     * @param {Function} reporter
     */
    addPostProcessor: function (reporter) {
      _postProcessors.push(reporter);
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
    }
  });

  if (Meteor.isServer) {
    _.extend(Velocity, {
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
  }


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
    },  // end copySampleTests


    /**
     * Starts a new mirror if it has not already been started, and reuses an
     * existing one if it is already started.
     *
     * This method will update the `VelocityMirrors` collection with `requestId`
     * once the mirror is ready for use.
     *
     * @method velocity/mirrors/request
     *
     * @param {Object} options                  Options for the mirror.
     * @param {String} options.framework        The name of the calling framework
     * @param {String} [options.fixtureFiles]   Array of files with absolute paths
     * @param {String} [options.port]           String use a specific port
     * @param {String} [options.requestId]      Id for the mirror that may be used to query the mirror for status info
     * @param {String} [options.rootUrlPath]    Adds this string to the end of the root url in the VelocityMirrors collection.
     *                                          eg. `/?jasmine=true`
     *                                          Request parameters that velocity-ci uses.
     *
     * @return {String} The `requestId` that can be used to query the mirror
     */
    'velocity/mirrors/request': function (options) {
      check(options, {
        framework: String,
        port: Match.Optional(Number),
        fixtureFiles: Match.Optional([String]),
        requestId: Match.Optional(String),
        rootUrlPath: Match.Optional(String)
      });
      options.port = options.port || 5000;
      options.requestId = options.requestId || Random.id();

      var mirrorUrl = _getMirrorUrl(options.port);
      var rootUrlPath = (options.rootUrlPath || '').replace(/\//, '');
      options.rootUrl = mirrorUrl + rootUrlPath;

      DEBUG && console.log('[velocity] Mirror requested', options,
                           'requestId:', options.requestId);


      var connectToMirrorViaDDP = function () {
        DEBUG && console.log('[velocity] Connecting to mirror via DDP...');
        var ddpConnection = DDP.connect(mirrorUrl);
        ddpConnection.onReconnect = function () {
          DEBUG && console.log('[velocity] Connected, updating mirror metadata');
          _updateMirrorMetadata(options);
          this.disconnect();
        };
      };

      DEBUG && console.log('[velocity] Checking if requested mirror is already started.');
      if (!_isProcessRunningForRegisteredMirrorPid(options.port)) {
        DEBUG && console.log('[velocity] Requested mirror not started. Starting...');
        _velocityStartMirror(options, function () {
          connectToMirrorViaDDP();
        });
      } else {
        DEBUG && console.log('[velocity] Requested mirror pid already running. Reusing...');
        connectToMirrorViaDDP();
      }

      return options.requestId;
    },


    /**
     * Syncs the mirror filesystem on an adhoc basis.
     * Used by the core when file changes are detected.
     *
     * @method velocity/syncMirror
     */
    'velocity/syncMirror': function () {
      DEBUG && console.log('[velocity] client restart requested velocity/syncMirror');
      _syncMirror();
    }

  });  // end Meteor methods




//////////////////////////////////////////////////////////////////////
// Private functions
//


  /**
   * Starts a mirror and copies any specified fixture files into the mirror.
   *
   * @method velocityStartMirror
   * @param {Object} options Required fields:
   *                   framework - String ex. 'mocha-web-1'
   *                   rootUrl - String ex. 'http://localhost:5000/x=y'
   *
   *                 Optional parameters:
   *                   fixtureFiles - Array of files with absolute paths
   *                   port - String use a specific port instead of finding the next available one
   *                   next - function to call after the mirror has started
   *
   * @private
   */
  function _velocityStartMirror (options, next) {

    var port = options.port;
    var mongoLocation = _getMongoUrl(options.framework);
    var mirrorLocation = _getMirrorUrl(port);

    if (options.fixtureFiles) {
      _addFixtures(options.fixtureFiles);
    }

    var opts = {
      cwd: Velocity.getMirrorPath(),
      stdio: 'pipe',
      env: _.extend({}, process.env, {
        ROOT_URL: mirrorLocation,
        MONGO_URL: mongoLocation,
        PARENT_URL: process.env.ROOT_URL,
        IS_MIRROR: true
      })
    };

    var settingsPath = path.join(Velocity.getMirrorPath(), 'settings.json');
    outputFile(settingsPath, JSON.stringify(Meteor.settings));

    console.log('[velocity] Starting mirror at', mirrorLocation);


    // perform a forced rsync as we are about to start a mirror
    _syncMirror(true, function () {
      _startMeteor(port, settingsPath, opts, function () {
        // do another forced sync in case the user changes any files whilst the mirror is starting up
        next();
      });
    });

  } // end velocityStartMirror

  /**
   * Updated the VelocityMirrors collection with metadata about a newly started or reused mirror
   *
   * @method _updateMirrorMetadata
   * @param {Object} options Required fields:
   *                   framework - String ex. 'mocha-web-1'
   *                   port - String the port the mirror that just started / was reused is using
   *                   requestId - the request id to put in the mirror metadata
   *
   * @private
   */
  function _updateMirrorMetadata (options) {
    // if this is a request we've seen before
    var existingMirror = VelocityMirrors.findOne({
      framework: options.framework,
      port: options.port
    });
    if (existingMirror) {
      // if we already have this mirror metadata, update it
      VelocityMirrors.update(existingMirror._id, {$set: {requestId: options.requestId}});
    } else {
      // if this is a request we haven't seen before, create a new metadata entry
      VelocityMirrors.upsert(
        {
          framework: options.framework,
          port: options.port
        }, {
          framework: options.framework,
          port: options.port,
          rootUrl: options.rootUrl,
          mongoUrl: _getMongoUrl(options.framework),
          requestId: options.requestId
        });
    }
  }

  // TODO DOC IT UP
  function _startMeteor (port, settingsPath, procOpts, next) {

    var meteorArgs = [];
    meteorArgs.push('--port', port);
    meteorArgs.push('--settings', settingsPath);

    var meteorProc = child_process.execFile('meteor', meteorArgs, procOpts);
    meteorProc.stdout.pipe(process.stdout);
    meteorProc.stderr.pipe(process.stderr);
    var stopMeteorProc = function () {
      DEBUG && console.log('[velocity] killing mirror');
      meteorProc.kill();
    };
    process.on('SIGINT', stopMeteorProc);

    meteorProc.on('exit', function (code, signal) {
      DEBUG && console.log('[velocity] Mirror exited with code:', code, ' signal:', signal);
      process.removeListener('SIGINT', stopMeteorProc);
      // should we respawn here based on code/signal?
    });

    meteorProc.stdout.setEncoding('utf8');
    var processMeteorStartup = Meteor.bindEnvironment(function (data) {
      if (data.match(/Started Proxy/i)) {
        console.log('[velocity] Mirror started.');
        var mirrorPidId = MIRROR_PID_VAR_TEMPLATE.replace('@PORT', port);
        VelocityVars.upsert({_id: mirrorPidId}, {_id: mirrorPidId, value: meteorProc.pid});
        meteorProc.stdout.removeListener('data', processMeteorStartup);
        next(null, meteorProc);
      }
      else if (data.match(/Perhaps another Meteor is running/i)) {
        next(new Error(data));
      }
      // TODO there are more scenarios where meteor exists and we need to have those covered
    });
    meteorProc.stdout.on('data', processMeteorStartup);
  }

  /**
   * Returns true if a mirror with the specified port was started by Velocity and if the pid stored
   * at the time is currently running. This method DOES NOT check the actual connection
   * @param port this is used to look up the PID for the mirror if it was started by Velocity
   * @returns {string} true if the registered mirror process is running
   * @private
   */
  function _isProcessRunningForRegisteredMirrorPid (port) {
    var mirrorPid = MIRROR_PID_VAR_TEMPLATE.replace('@PORT', port);
    var pid = VelocityVars.findOne(mirrorPid);
    if (!pid) {
      return false;
    }
    DEBUG && console.log('[velocity] Checking if mirror is running with pid', pid);
    try {
      process.kill(pid.value, 0);
      DEBUG && console.log('[velocity] process with pid', pid, 'is running');
      return true;
    } catch (e) {
      DEBUG && console.log('[velocity] process with ', pid, 'is not running');
      return false;
    }
  }

  function _getTestFrameworkNames () {
    return _.pluck(_config, 'name');
  }

  /**
   * Returns the MongoDB URL for the given database.
   * @param database
   * @returns {string} MongoDB Url
   * @private
   */
  function _getMongoUrl (database) {
    var mongoLocationParts = url.parse(process.env.MONGO_URL);
    return url.format({
      protocol: mongoLocationParts.protocol,
      slashes: mongoLocationParts.slashes,
      hostname: mongoLocationParts.hostname,
      port: mongoLocationParts.port,
      pathname: '/' + database
    });
  }

  /**
   * Return URL for the mirror with the given port.
   * @param port Mirror port
   * @returns {string} Mirror URL
   * @private
   */
  function _getMirrorUrl (port) {
    var rootUrlParts = url.parse(Meteor.absoluteUrl());
    return url.format({
      protocol: rootUrlParts.protocol,
      slashes: rootUrlParts.slashes,
      hostname: rootUrlParts.hostname,
      port: port,
      pathname: rootUrlParts.pathname
    });
  }

  /**
   * Add fixtures to the database.
   * @param fixtureFiles Array with fixture file paths.
   * @private
   */
  function _addFixtures (fixtureFiles) {
    _.each(fixtureFiles, function (fixtureFile) {
      VelocityFixtureFiles.insert({
        _id: fixtureFile,
        absolutePath: fixtureFile
      });
    });
  }

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

    console.log('[velocity] chokadir watching ' + Velocity.getTestsPath());

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

      // if this is a fixture file, put it in the fixtures collection
      if (FIXTURE_REG_EXP.test(relativePath)) {
        DEBUG && console.log('[velocity] Found fixture file', relativePath);
        VelocityFixtureFiles.insert({
          _id: filePath,
          absolutePath: filePath,
          lastModified: Date.now()
        });
        // update the mirror right away
        _syncMirror(true);
        return;
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

        //DEBUG && console.log('data', data);
        VelocityTestFiles.insert(data);
      }
    }));  // end watcher.on 'add'

    _watcher.on('change', Meteor.bindEnvironment(function (filePath) {
      DEBUG && console.log('File changed:', filePath);

      // Since we key on filePath and we only add files we're interested in,
      // we don't have to worry about inadvertently updating records for files
      // we don't care about.
      VelocityFixtureFiles.update(filePath, {$set: {lastModified: Date.now()}});
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
    VelocityFixtureFiles.remove({});
    VelocityFixtureFiles.insert({
      _id: DEFAULT_FIXTURE_PATH,
      absolutePath: DEFAULT_FIXTURE_PATH
    });
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
    VelocityMirrors.remove({});

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

        _.each(_postProcessors, function (reporter) {
          reporter();
        });

      }
    }

  }

  /**
   * Creates a physical mirror of the application under .meteor/local/.mirror
   *
   *     - Any files with the pattern tests/.*  are not copied, this stops .report
   *     directory from also being copied.
   *
   *     TODO - Strips out velocity and reporters from the mirror's .meteor/packages file
   *
   * @method _syncMirror
   * @param force performs an rsync even if no mirrors have been requested
   * @private
   */
  var _syncing = false;

  function _syncMirror (force, next) {

    // de-bounce sync requests
    if (_syncing) {
      DEBUG && console.log('[velocity] de-bouncing sync mirror');
      next && next();
      return;
    }

    // don't sync if no mirrors have been requested, unless force is set
    if (!force && VelocityMirrors.find().count() === 0) {
      DEBUG && console.log('[velocity] not syncing as no mirror metadata was found.');
      next && next();
      return;
    }

    _syncing = true;
    DEBUG && console.log('[velocity] syncing mirror');


    var cmd = new Rsync()
      .shell('ssh')
      .flags('av')
      .set('delete')
      .set('delay-updates')
      .exclude('/.meteor/local')
      .exclude('/tests/.*')
      .exclude('/packages')
      // This file is created by velocity:core.
      // It must be excluded to prevent rsync from deleting it.
      .exclude('/settings.json')
      // We must use escapeShellArgument until
      // https://github.com/mattijs/node-rsync/pull/23
      // has been pulled.
      .source(escapeShellArgument(Velocity.getAppPath()) + path.sep)
      .destination(escapeShellArgument(Velocity.getMirrorPath()));
    var then = Date.now();
    cmd.execute(Meteor.bindEnvironment(function (error) {

      if (error) {
        console.error('[velocity] Error syncing mirror', error);
      } else {
        DEBUG && console.log('[velocity] rsync took', Date.now() - then);
      }

      _copyFixtureFilesIntoMirror();
      _symlinkPackagesDirIfPresent();

      _.each(_preProcessors, function (preProcessor) {
        preProcessor();
      });

      _syncing = false;

      next && next();

    }));
  }

  // DOC IT UP
  function _copyFixtureFilesIntoMirror () {
    DEBUG && console.log('[velocity] copying fixture files');
    VelocityFixtureFiles.find({}).forEach(function (fixture) {
      var fixtureLocationInMirror = Velocity.getMirrorPath() + path.sep + path.basename(fixture.absolutePath) + path.extname(fixture.absolutePath);
      DEBUG && console.log('[velocity] adding fixture to watch list', fixture.absolutePath, 'to mirror');
      copyFile(fixture.absolutePath, fixtureLocationInMirror);
    });
  }

  /**
   * Checks if the user has a local packages directory, if so it ensures it's symlinked in the mirror.
   * The reason this is needed is because the standard rsync will copy a the packages dir and not respect
   * the symlinks inside it.
   *
   * @method _symlinkPackagesDirIfPresent
   * @private
   */
  function _symlinkPackagesDirIfPresent () {
    var packagesDir = path.join(process.env.PWD, 'packages'),
        mirrorPackagesDir = path.join(Velocity.getMirrorPath(), 'packages');

    if (fs.existsSync(packagesDir) && !fs.existsSync(mirrorPackagesDir)) {
      DEBUG && console.log('[velocity] symlinking packages into mirror');
      fs.symlinkSync(packagesDir, mirrorPackagesDir);
    }

  }

})();
