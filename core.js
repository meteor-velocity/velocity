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
 * @class Velocity
 */
Velocity = {};

(function () {
  'use strict';

//////////////////////////////////////////////////////////////////////
// Init
//

  if (process.env.NODE_ENV !== 'development' || process.env.VELOCITY === '0' || process.env.IS_MIRROR) {
    DEBUG && console.log('Not adding velocity code');
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
      fse = Npm.require('fs-extra'),
      outputFile = Meteor.wrapAsync(fse.outputFile),
      copyFile = Meteor.wrapAsync(fse.copy),
      path = Npm.require('path'),
      url = Npm.require('url'),
      Rsync = Npm.require('rsync'),
      child_process = Npm.require('child_process'),
      spawn = child_process.spawn,
      chokidar = Npm.require('chokidar'),
      mkdirp = Npm.require('mkdirp'),
      _config = {},
      _preProcessors = [],
      _postProcessors = [],
      _watcher,
      FIXTURE_REG_EXP = new RegExp('-fixture.(js|coffee)$'),
      DEFAULT_FIXTURE_PATH = getAssetPath('velocity:core', 'default-fixture.js');

  Meteor.startup(function initializeVelocity () {
    DEBUG && console.log('[velocity] app dir', Velocity.getAppPath());
    DEBUG && console.log('velocity config =', JSON.stringify(_config, null, 2));

    // kick-off everything
    _reset(_config);
  });

//////////////////////////////////////////////////////////////////////
// Public Methods
//

  _.extend(Velocity, {

    getAppPath: function () {
      return findAppDir();
    },

    getMirrorPath: function () {
      return path.join(Velocity.getAppPath(), '.meteor', 'local', '.mirror');
    },

    getTestsPath: function () {
      return path.join(Velocity.getAppPath(), 'tests');
    },

    addPreProcessor: function (preProcessor) {
      _preProcessors.push(preProcessor);
    },

    addPostProcessor: function (reporter) {
      _postProcessors.push(reporter);
    },

    getReportGithubIssueMessage: function () {
      return 'Please report the issue here: https://github.com/xolvio/velocity/issues';
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
      }
    });
  }

//////////////////////////////////////////////////////////////////////
// Meteor Methods
//

  Meteor.methods({

    /**
     * Meteor method: velocity/reset
     * Re-init file watcher and clear all test results.
     *
     * @method velocity/reset
     */
    'velocity/reset': function () {
      _reset(_config);
    },

    /**
     * Meteor method: velocity/reports/reset
     * Clear all test results.
     *
     * @method velocity/reports/reset
     * @param {Object} [options] Optional, specify specific framework to clear
     *                 and/or define a list of tests to keep.
     *                 ex.
     *                 {
     *                   framework: 'jasmine-unit',
     *                   notIn: ['tests/auth-jasmine-unit.js']
     *                 }
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
     * Meteor method: velocity/logs/reset
     * Clear all log entried.
     *
     * @method velocity/logs/reset
     * @param {Object} [options] Optional, specify specific framework to clear
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
     * Meteor method: velocity/logs/submit
     * Log a method to the central Velocity log store.
     *
     * @method velocity/logs/submit
     * @param {Object} options Required parameters:
     *                   type - String
     *                   message - String
     *                   framework - String  ex. 'jasmine-unit'
     *
     *                 Optional parameters:
     *                   timestamp - Date
     */
    'velocity/logs/submit': function (options) {
      check(options, {
        type: String,
        message: String,
        framework: String,
        timestamp: Match.Optional(Match.OneOf(Date, String))
      });

      VelocityLogs.insert({
        timestamp: options.timestamp || new Date(),
        type: options.type,
        message: options.message,
        framework: options.framework
      });
    },

    /**
     * Meteor method: velocity/reports/submit
     *
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
     *                           provided, frameworks can use the 'resetReports'
     *                           Meteor method to clear all tests.
     * @param {Array} [data.ancestors] The hierarchy of suites and blocks above
     *                                 this test. For example,
     *                              ['Template', 'leaderboard', 'selected_name']
     * @param {Date} [data.timestamp] The time that the test started for this
     *                                result.
     * @param {Number} [data.duration] The test duration milliseconds.
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
      data.id = data.id || Meteor.uuid();

      VelocityTestReports.upsert(data.id, {$set: data});

      _updateAggregateReports();
    },  // end postResult

    /**
     * Meteor method: velocity/reports/completed
     * Frameworks must call this method to inform Velocity they have completed
     * their current test runs. Velocity uses this flag when running in CI mode.
     *
     * @method velocity/reports/completed
     * @param {Object} data Required fields:
     *                   framework - String  ex. 'jasmine-unit'
     */
    'velocity/reports/completed': function (data) {
      check(data, {
        framework: String
      });

      VelocityAggregateReports.upsert({'name': data.framework}, {$set: {'result': 'completed'}});
      _updateAggregateReports();
    },  // end completed

    /**
     * Meteor method: velocity/copySampleTests
     * Copy sample tests from frameworks `sample-tests` directories
     * to user's `app/tests` directory.
     *
     * @method velocity/copySampleTests
     * @param {Object} options
     *     ex. {framework: 'jasmine-unit'}
     */
    'velocity/copySampleTests': function (options) {
      var samplesPath,
          testsPath,
          command;

      options = options || {};
      check(options, {
        framework: String
      });

      if (_config[options.framework].sampleTestGenerator) {
        var sampleTests = _config[options.framework].sampleTestGenerator(options);
        DEBUG && console.log('[velocity] found ', sampleTests.length, 'sample test files for', options.framework);
        sampleTests.forEach(function (testFile) {
          var fullTestPath = path.join(Velocity.getTestsPath(), testFile.path);
          var testDir = path.dirname(fullTestPath);
          mkdirp.sync(testDir);
          fs.writeFileSync(fullTestPath, testFile.contents);
        });
      } else {
        samplesPath = path.join(Velocity.getAppPath(), 'packages', options.framework, 'sample-tests');
        testsPath = Velocity.getTestsPath();

        DEBUG && console.log('[velocity] checking for sample tests in', path.join(samplesPath, '*'));

        if (fs.existsSync(samplesPath)) {
          command = 'mkdir -p ' + testsPath + ' && ' +
          'rsync -au ' + path.join(samplesPath, '*') +
          ' ' + testsPath + path.sep;

          DEBUG && console.log('[velocity] copying sample tests (if any) for framework', options.framework, '-', command);

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
     * Meteor method: velocity/mirrors/request
     * Starts a new mirror if it has not already been started, and reuses an existing one if it is already started.
     * This method will return a requestId. Frameworks need to observe the VelocityMirrors collection for a document for
     * {requestId: requestId} to know when the mirror is ready.
     *
     * @method velocity/mirrors/request
     *
     * @param {Object} options                  Options for the mirror.
     * @param {String} options.framework        The name of the calling framework
     * @param {String} [options.fixtureFiles]   Array of files with absolute paths
     * @param {String} [options.port]           String use a specific port
     * @param {String} [options.requestId]      Id for the mirror that is used to query the mirror info
     * @param {String} [options.rootUrlPath]    Adds this string to the end of the root url in the VelocityMirrors collection. eg. /?jasmine=true
     *                                          request parameters that velocity-ci uses
     *
     * @return requestId    this method will update the VelocityMirrors collection with a requestId once the mirror is ready for use
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

      var rootUrlPath = options.rootUrlPath ? options.rootUrlPath.replace(/\//, '') : '';
      options.rootUrl = _getMirrorUrl(options.port) + rootUrlPath;

      DEBUG && console.log(
        '[velocity] Mirror requested', options,
        'requestId:', options.requestId
      );

      _retryHttpGet(options.rootUrl, function (error, result) {

        // if this mirror already been started, reuse it
        if (!error && result.statusCode === 200) {
          DEBUG && console.log('[velocity] Requested mirror already exists. Reusing...');
          _reuseExistingMirror(options);
        }

        // if the mirror not been started at all, start a new one
        if (error && error.indexOf('ECONNREFUSED') !== -1) {
          DEBUG && console.log('[velocity] Requested mirror not started. Starting...');
          _velocityStartMirror(options);
        }

        // if a mirror exists but is failing for some other reason, let the user know why in the console
        if (error && error.indexOf('ECONNREFUSED') === -1) {
          DEBUG && console.log('[velocity] Mirror could not start', error);
        } else if (!error && result.statusCode !== 200) {
          DEBUG && console.log('[velocity] Mirror started but returnd non-200 response', result);
        }


      });

      // frameworks know a mirror is ready by observing VelocityMirrors for this requestId
      return options.requestId;
    },

    /**
     * Meteor method: velocity/isMirror
     * Exposes the IS_MIRROR flag to clients
     *
     * @method velocity/isMirror
     */
    'velocity/isMirror': function () {
      return !!process.env.IS_MIRROR;
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
   *
   * @private
   */
  function _velocityStartMirror (options) {

    // perform a forced rsync as we are about to start a mirror
    _syncMirror(true);

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

    DEBUG && console.log('[velocity] Mirror: starting at', mirrorLocation);

    var spawnAttempts = 10;
    var spawnMeteor = function () {
      var closeHandler = function (code, signal) {
        console.log('[velocity] Mirror: exited with code ' + code + ' signal ' + signal);
        setTimeout(function () {
          DEBUG && console.log('[velocity] Mirror: trying to restart');
          spawnAttempts--;
          if (spawnAttempts) {
            spawnMeteor();
          } else {
            console.error('[velocity] Mirror: could not be started on port ' + port + '.\n' +
            'Please make sure that nothing else is using the port and then restart your app to try again.');
          }
        }, 1000);
      };
      var meteor = spawn(
        'meteor',
        ['--port', port, '--settings', settingsPath],
        opts
      );
      meteor.on('close', closeHandler);

      // FIXME there's a better way to do this with streams
      var outputHandler = function (data) {
        var lines = data.toString().split(/\r?\n/).slice(0, -1);
        _.map(lines, function (line) {
          console.log('[velocity mirror] ' + line);
        });
      };
      if (!!process.env.VELOCITY_DEBUG_MIRROR) {
        meteor.stdout.on('data', outputHandler);
      }
      meteor.stderr.on('data', outputHandler);
    };
    spawnMeteor();

    var storeMirrorMetadata = function () {
      VelocityMirrors.upsert(
        {
          framework: options.framework,
          port: port
        }, {
          framework: options.framework,
          port: port,
          rootUrl: options.rootUrl,
          mongoUrl: mongoLocation,
          requestId: options.requestId
        });
    };

    _retryHttpGet(mirrorLocation, function (error, result) {
      if (!error && result.statusCode === 200) {
        DEBUG && console.log('[velocity] Mirror started at', mirrorLocation, 'with result:', result);
        storeMirrorMetadata();
      } else {
        console.error('Mirror did not start correctly.', error || result);
      }
    });

  } // end velocityStartMirror

  /**
   * Reuses a mirror is it has already been started and updated the VelocityMirrors collection
   *
   * @method _reuseExistingMirror
   * @param {Object} options Required fields:
   *                   framework - String ex. 'mocha-web-1'
   *                   port - String use a specific port
   *                   requestId - the request id to put in the mirror metadata
   *
   * @private
   */
  function _reuseExistingMirror (options) {
    // if this is a request we've seen before
    var existingMirror = VelocityMirrors.findOne({framework: options.framework, port: options.port});
    if (existingMirror) {
      // if we already have this mirror metadata, update it
      VelocityMirrors.update(existingMirror._id, {$set: {requestId: options.requestId}});
    } else {
      // if this is a request we haven't seen before, create a new metadata entry
      VelocityMirrors.insert({
        framework: options.framework,
        port: options.port,
        rootUrl: options.rootUrl,
        mongoUrl: _getMongoUrl(options.framework),
        requestId: options.requestId
      });
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

  /**
   *
   * Performs a http get and retries the specified number of times with the specified timeouts.
   * Uses a future to respond and the future return object can be provided.
   *
   * @method _retryHttpGet
   * @param url                   requiredFields  The target location
   * @param callback              calls back with (error, result) where error is the exception and result is the status code
   *
   * @return    A future that can be used in meteor methods (or for other async needs)
   * @private
   */
  function _retryHttpGet (url, callback) {
    var retry = new Retry({
      baseTimeout: 100,
      maxTimeout: 2000
    });
    var tries = 0;
    var doGet = function () {
      try {
        var res = HTTP.get(url);
        callback(null, {statusCode: res.statusCode});
      } catch (ex) {

        if (ex.message.indexOf('ECONNREFUSED') === -1) {
          throw(ex);
        }

        if (tries < 10) {
          DEBUG && console.log('[velocity] retrying mirror at ', url);
          retry.retryLater(++tries, doGet);
        } else {
          callback(ex.message);
        }
      }
    };

    doGet();
  } // end _retryHttpGet


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

      // if this is a fixture file, put it in the fixtures collection
      if (FIXTURE_REG_EXP.test(relativePath)) {
        VelocityFixtureFiles.insert({
          _id: filePath,
          absolutePath: filePath,
          lastModified: Date.now()
        });
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

    // Meteor just reloaded us which means we should rsync the app files to the mirror
    _syncMirror();

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
  function _syncMirror (force) {

    // don't sync if no mirrors have been requested
    if (!force && VelocityMirrors.find().count() === 0) {
      return;
    }

    var cmd = new Rsync()
      .shell('ssh')
      .flags('av')
      .set('delete')
      .set('q')
      .set('delay-updates')
      .set('force')
      .exclude('/.meteor/local')
      .exclude('/tests/.*')
      .exclude('/packages')
      .source(Velocity.getAppPath() + path.sep)
      .destination(Velocity.getMirrorPath());
    var then = Date.now();
    cmd.execute(Meteor.bindEnvironment(function (error) {

      if (error) {
        DEBUG && console.error('[velocity] Error syncing mirror', error);
      } else {
        DEBUG && console.log('[velocity] rsync took', Date.now() - then);
      }

      _symlinkPackagesDirIfPresent();

      _.each(_preProcessors, function (preProcessor) {
        preProcessor();
      });

      VelocityFixtureFiles.find({}).forEach(function (fixture) {
        var fixtureLocationInMirror = Velocity.getMirrorPath() + path.sep + path.basename(fixture.absolutePath) + path.extname(fixture.absolutePath);
        DEBUG && console.log('[velocity] copying fixture', fixture.absolutePath, 'to', fixtureLocationInMirror);
        copyFile(fixture.absolutePath, fixtureLocationInMirror);
      });

    }));
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
      fs.symlinkSync(packagesDir, mirrorPackagesDir);
    }

  }

})();
