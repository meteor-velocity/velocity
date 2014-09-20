/*jshint -W117, -W030 */
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

  var isMeteor92OrNewer = function () {
    if (Meteor.release) {
      var versionRegExp = /(?:METEOR@)?(\d+)\.(\d+)\.(\d+)(?:\.(\d+))/;
      var version = versionRegExp.exec(Meteor.release);
      if (version) {
        var majorVersion = Number(version[1]);
        var minorVersion = Number(version[2]);
        var patchVersion = Number(version[3]);
        if (majorVersion > 0 ||
          (majorVersion == 0 && minorVersion > 9) ||
          (majorVersion == 0 && minorVersion == 9 && patchVersion >= 2)
          ) {
          return true;
        }
      }
    }

    return false;
  };

  var getAssetPath = function (packageName, fileName) {
    var serverAssetsPath = path.join(
      process.env.PWD, '.meteor', 'local', 'build', 'programs', 'server', 'assets'
    );
    if (isMeteor92OrNewer()) {
      packageName = packageName.replace(':', '_')
    }

    return path.join(serverAssetsPath, 'packages', packageName, fileName);
  };

  var _ = Npm.require('lodash'),
      fs = Npm.require('fs'),
      fse = Npm.require('fs-extra'),
      readFile = Meteor._wrapAsync(fs.readFile),
      writeFile = Meteor._wrapAsync(fs.writeFile),
      copyFile = Meteor._wrapAsync(fse.copy),
      path = Npm.require('path'),
      url = Npm.require('url'),
      Rsync = Npm.require('rsync'),
      Future = Npm.require('fibers/future'),
      freeport = Npm.require('freeport'),
      child_process = Npm.require('child_process'),
      spawn = child_process.spawn,
      chokidar = Npm.require('chokidar'),
      glob = Npm.require('glob'),
      _config = {},
      _testFrameworks,
      _preProcessors = [],
      _postProcessors = [],
      _watcher,
      FIXTURE_REG_EXP = new RegExp("-fixture.(js|coffee)$"),
      DEFAULT_FIXTURE_PATH = getAssetPath('velocity:core', 'default-fixture.js');

  Meteor.startup(function initializeVelocity () {
    DEBUG && console.log('[velocity] PWD', process.env.PWD);

    // Prefer Velocity.registerTestingFramework over smart.json
    _.defaults(_config, _loadTestPackageConfigs());
    _testFrameworks = _.pluck(_config, function (config) {
      return config.name;
    });
    DEBUG && console.log('velocity config =', JSON.stringify(_config, null, 2));

    // kick-off everything
    _reset(_config);
  });

//////////////////////////////////////////////////////////////////////
// Public Methods
//

  _.extend(Velocity, {

    getMirrorPath: function () {
      return path.join(process.env.PWD, '.meteor', 'local', '.mirror');
    },

    getTestsPath: function () {
      return path.join(process.env.PWD, 'tests');
    },

    addPreProcessor: function (preProcessor) {
      _preProcessors.push(preProcessor);
    },

    addPostProcessor: function (reporter) {
      _postProcessors.push(reporter);
    },

    getReportGithubIssueMessage: function() {
      return "Please report the issue here: https://github.com/xolvio/velocity/issues";
    }
  });

  if (Meteor.isServer) {
    _.extend(Velocity, {

      /**
       * Registers a testing framework plugin.
       *
       * @method registerTestingFramework
       * @param name {String} The name of the testing framework.
       * @param options {Object} Options for the testing framework.
       * @param options.regex {String} The regular expression for
       *                      test files that should be assigned
       *                      to the testing framework.
       */
      registerTestingFramework: function (name, options) {
        _config[name] = _parseTestingFrameworkOptions(name, options);
      },
      parseXmlFiles: function  (selectedFramework){
         closeFunc = Meteor.bindEnvironment(function () {
           console.log('binding environment and parsing output xml files...')

            function hashCode (s) {
              return s.split("").reduce(function (a, b) {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0);
            }

           var newResults = [];
           //var globSearchString = parsePath('**/FIREFOX*.xml');
           var globSearchString = path.join('**', 'FIREFOX_*.xml');
           var xmlFiles = glob.sync(globSearchString, { cwd: testReportsPath });

           console.log('globSearchString', globSearchString);

           _.each(xmlFiles, function (xmlFile, index) {
             parseString(fs.readFileSync(testReportsPath + path.sep + xmlFile), function (err, result) {
               _.each(result.testsuites.testsuite, function (testsuite) {
                 _.each(testsuite.testcase, function (testcase) {
                   var result = ({
                     name: testcase.$.name,
                     framework: selectedFramework,
                     result: testcase.failure ? 'failed' : 'passed',
                     timestamp: testsuite.$.timestamp,
                     time: testcase.$.time,
                     ancestors: [testcase.$.classname]
                   });

                   if (testcase.failure) {
                     _.each(testcase.failure, function (failure) {
                       result.failureType = failure.$.type;
                       result.failureMessage = failure.$.message;
                       result.failureStackTrace = failure._;
                     });
                   }
                   result.id = selectedFramework + ':' + hashCode(xmlFile + testcase.$.classname + testcase.$.name);
                   newResults.push(result.id);
                   console.log('result', result);
                   Meteor.call('postResult', result);
                 });
               });
             });

             if (index === xmlFiles.length - 1) {
               Meteor.call('resetReports', {framework: selectedFramework, notIn: newResults});
               Meteor.call('completed', {framework: selectedFramework});
             }
           });
         });
      }
    });
  }

//////////////////////////////////////////////////////////////////////
// Meteor Methods
//

  Meteor.methods({

    /**
     * Meteor method: reset
     * Re-init file watcher and clear all test results.
     *
     * @method reset
     */
    reset: function () {
      _reset(_config);
    },

    /**
     * Meteor method: resetReports
     * Clear all test results.
     *
     * @method resetReports
     * @param {Object} [options] Optional, specify specific framework to clear
     *                 and/or define a list of tests to keep.
     *                 ex.
     *                 {
     *                   framework: 'jasmine-unit',
     *                   notIn: ['tests/auth-jasmine-unit.js']
     *                 }
     */
    resetReports: function (options) {
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
        query = _.assign(query, {_id: {$nin: options.notIn }});
      }
      VelocityTestReports.remove(query);
      _updateAggregateReports();
    },

    /**
     * Meteor method: resetLogs
     * Clear all log entried.
     *
     * @method resetLogs
     * @param {Object} [options] Optional, specify specific framework to clear
     */
    resetLogs: function (options) {
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
     * Meteor method: postLog
     * Log a method to the central Velocity log store.
     *
     * @method postLog
     * @param {Object} options Required parameters:
     *                   type - String
     *                   message - String
     *                   framework - String  ex. 'jasmine-unit'
     *
     *                 Optional parameters:
     *                   timestamp - Date
     */
    postLog: function (options) {
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
     * Meteor method: postResult
     * Record the results of a test run.
     *
     * @method postResult
     * @param {Object} data Required fields:
     *                   id - String
     *                   name - String
     *                   framework - String  ex. 'jasmine-unit'
     *                   result - String.  ex. 'failed', 'passed' or 'pending'
     *
     *                 Suggested fields:
     *                   isClient - {Boolean] Is it a client test?
     *                   isServer - {Boolean} Is it a server test?
     *                   browser  - {String} In which browser did the test run?
     *                   timestamp - {Date} The time that the test started for this result
     *                   async - // TODO @rissem to write
     *                   timeOut - // TODO @rissem to write
     *                   failureType - {String} ex 'expect' or 'assert'
     *                   failureMessage - {String} The failure message from the test framework
     *                   failureStackTrace - {String} The stack trace associated with the failure
     *                   ancestors - The hierarchy of suites and blocks above this test
     *                               ex. 'Template.leaderboard.selected_name'
     */
    postResult: function (data) {
      check(data, Match.ObjectIncluding({
        id: String,
        name: String,
        framework: _matchOneOf(_.keys(_config)),
        result: _matchOneOf(['passed', 'failed', 'pending']),
        isClient: Match.Optional(Boolean),
        isServer: Match.Optional(Boolean),
        browser: Match.Optional(_matchOneOf(['chrome', 'firefox', 'internet explorer', 'opera', 'safari'])), // TODO: Add missing values
        timestamp: Match.Optional(Match.OneOf(Date, String)),
        async: Match.Optional(Boolean),
        timeOut: Match.Optional(Match.Any),
        failureType: Match.Optional(String),
        failureMessage: Match.Optional(String),
        failureStackTrace: Match.Optional(Match.Any),
        ancestors: Match.Optional([String])
      }));

      VelocityTestReports.upsert(data.id, {$set: data});
      _updateAggregateReports();
    },  // end postResult

    /**
     * Meteor method: completed
     * Frameworks must call this method to inform Velocity they have completed
     * their current test runs. Velocity uses this flag when running in CI mode.
     *
     * @method completed
     * @param {Object} data Required fields:
     *                   framework - String  ex. 'jasmine-unit'
     */
    completed: function (data) {
      check(data, {
        framework: String
      });

      VelocityAggregateReports.upsert({'name': data.framework}, {$set: {'result': 'completed'}});
      _updateAggregateReports();
    },  // end completed

    /**
     * Meteor method: copySampleTests
     * Copy sample tests from frameworks `sample-tests` directories
     * to user's `app/tests` directory.
     *
     * @method copySampleTests
     * @param {Object} options
     *     ex. {framework: 'jasmine-unit'}
     */
    copySampleTests: function (options) {
      var pwd = process.env.PWD,
          samplesPath,
          testsPath,
          command;

      options = options || {};
      check(options, {
        framework: String
      });

      samplesPath = path.join(pwd, 'packages', options.framework, 'sample-tests');
      testsPath = path.join(pwd, 'tests');

      DEBUG && console.log('[velocity] checking for sample tests in', path.join(samplesPath, '*'));

      if (fs.existsSync(samplesPath)) {
        command = 'mkdir -p ' + testsPath + ' && ' +
          'rsync -au ' + path.join(samplesPath, '*') +
          ' ' + testsPath + path.sep;

        DEBUG && console.log('[velocity] copying sample tests (if any) for framework', options.framework, '-', command);

        child_process.exec(command, Meteor.bindEnvironment(
          function copySampleTestsExecHandler (err, stdout, stderr) {
            if (err) {
              console.log('ERROR', err);
            }
            console.log(stdout);
            console.log(stderr);
          },
          'copySampleTestsExecHandler'
        ));
      }
    },  // end copySampleTests

    /**
     * Meteor method: velocityStartMirror
     *
     * Starts a mirror and copies any specified fixture files into the mirror.
     * TODO and will remove any registered frameworks and reporters from the mirror
     *
     * @method velocityStartMirror
     * @param {Object} options Required fields:
     *                   name - String ex. 'mocha-web-1'
     *
     *                 Optional parameters:
     *                   fixtureFiles - Array of files with absolute paths
     *                   port - String use a specific port instead of finding the next available one
     *
     * @return the url of started mirror
     */
    velocityStartMirror: function (options) {
      check(options, {
        name: String,
        fixtureFiles: Match.Optional([String]),
        port: Match.Optional(Number)
      });

      var port = options.port || Meteor._wrapAsync(freeport)();
      var mongoLocation = _getMongoUrl(options.name);
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

      writeFile(Velocity.getMirrorPath() + '/settings.json', JSON.stringify(Meteor.settings));

      DEBUG && console.log('[velocity] Mirror: starting at', mirrorLocation);

      var spawnAttempts = 10;
      var spawnMeteor = function () {
        var closeHandler = function (code, signal) {
          console.log('[velocity] Mirror: exited with code ' + code + ' signal ' + signal);
          setTimeout(function () {
            console.log('[velocity] Mirror: trying to restart');
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
          ['--port', port, '--settings', 'settings.json'],
          opts
        );
        meteor.on('close', closeHandler);

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
        VelocityMirrors.insert({
          framework: options.framework,
          name: options.name,
          port: port,
          rootUrl: mirrorLocation,
          mongoUrl: mongoLocation
        });
      };

      return _retryHttpGet(mirrorLocation, {url: mirrorLocation, port: port}, function (statusCode) {
        if (statusCode === 200) {
          storeMirrorMetadata();
        } else {
          console.error('Mirror did not start correctly. Status code was ', statusCode);
        }
      });

    },  // end velocityStartMirror


    /**
     * Meteor method: velocityIsMirror
     * Exposes the IS_MIRROR flag to clients
     *
     * @method velocityIsMirror
     */
    velocityIsMirror: function () {
      return !!process.env.IS_MIRROR;
    }

  });  // end Meteor methods

//////////////////////////////////////////////////////////////////////
// Private functions
//

  /**
   * Returns the MongoDB URL for the given database.
   * @param database
   * @returns {string} MongoDB Url
   * @private
   */
  function _getMongoUrl (database) {
    var mongoLocationParts = url.parse(process.env.MONGO_URL);
    var mongoLocation = url.format({
      protocol: mongoLocationParts.protocol,
      slashes: mongoLocationParts.slashes,
      hostname: mongoLocationParts.hostname,
      port: mongoLocationParts.port,
      pathname: '/' + database
    });
    return mongoLocation;
  }

  /**
   * Return URL for the mirror with the given port.
   * @param port Mirror port
   * @returns {string} Mirror URL
   * @private
   */
  function _getMirrorUrl (port) {
    var rootUrlParts = url.parse(Meteor.absoluteUrl());
    var mirrorLocation = url.format({
      protocol: rootUrlParts.protocol,
      slashes: rootUrlParts.slashes,
      hostname: rootUrlParts.hostname,
      port: port,
      pathname: rootUrlParts.pathname
    });
    return mirrorLocation;
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
   *
   * @param futureResponse        optional        The future response that will be augmented with the
   *                                              http status code (if successful)
   * @param preResponseCallback   optional        Maximum number of retries
   * @param retries               optional        Maximum number of retries
   * @param maxTimeout            optional        Maximum time to wait for the location to respond
   *
   * @return    A future that can be used in meteor methods (or for other async needs)
   * @private
   */
  function _retryHttpGet (url, futureResponse, preResponseCallback, retries, maxTimeout) {
    var f = new Future();
    var retry = new Retry({
      baseTimeout: 100,
      maxTimeout: maxTimeout ? maxTimeout : 1000
    });
    var tries = 0;
    var doGet = function () {
      try {
        var res = HTTP.get(url);
        preResponseCallback && preResponseCallback(res.statusCode);
        f.return(_.extend({
          statusCode: res.statusCode
        }, futureResponse));
      } catch (ex) {
        if (tries < retries ? retries : 5) {
          DEBUG && console.log('[velocity] retrying mirror at ', url, ex.message);
          retry.retryLater(++tries, doGet);
        } else {
          console.error('[velocity] mirror failed to respond', ex.message);
          f.throw(ex);
        }
      }
    };
    doGet();
    return f.wait();
  } // end _retryHttpGet

  /**
   * Matcher for checking if a value is one of the given values.
   * @param {Array} values Valid values.
   * @returns {*}
   * @private
   */
  function _matchOneOf (values) {
    return Match.Where(function (value) {
      return (values.indexOf(value) !== -1);
    });
  }

  /**
   * Locate all velocity-compatible test packages and return their config
   * data.
   *
   * @example
   *     // in `jasmine-unit` package's `smart.json`:
   *     {
   *       "name": "jasmine-unit",
   *       "description": "Velocity-compatible jasmine unit test package",
   *       "homepage": "https://github.com/xolvio/jasmine-unit",
   *       "author": "Sam Hatoum",
   *       "version": "0.1.1",
   *       "git": "https://github.com/xolvio/jasmine-unit.git",
   *       "test-package": true,
   *       "regex": "-jasmine-unit\\.(js|coffee)$"
   *     }
   *
   * @method _loadTestPackageConfigs
   * @return {Object} Hash of test package names and their normalized config data.
   * @private
   */
  function _loadTestPackageConfigs () {
    var pwd = process.env.PWD,
        smartJsons = glob.sync('packages/*/smart.json', {cwd: pwd}),
        testConfigDictionary;

    DEBUG && console.log('Check for test package configs...', smartJsons);

    testConfigDictionary = _.reduce(smartJsons, function (memo, smartJsonPath) {
      var contents,
          config;

      try {
        contents = readFile(path.join(pwd, smartJsonPath));
        config = JSON.parse(contents);
        if (config.name && config.testPackage) {
          // add smart.json contents to our dictionary
          memo[config.name] = _parseTestingFrameworkOptions(config.name, config);
        }
      } catch (ex) {
        DEBUG && console.log('Error reading file:', smartJsonPath, ex);
      }
      return memo;
    }, {});

    return testConfigDictionary;
  }  // end _loadTestPackageConfigs

  function _parseTestingFrameworkOptions(name, options) {
    _.defaults(options, {
      name: name,
      // if test package hasn't defined an explicit regex for the file
      // watcher, default to the package name as a suffix.
      // Ex. name = "mocha-web"
      //     regex = "-mocha-web.js"
      regex: '-' + name + '\\.js$'
    });

    options._regexp = new RegExp(options.regex);

    return options;
  }

  /**
   * Initialize the directory/file watcher.
   *
   * @method _initWatcher
   * @param {Object} config  See `_loadTestPackageConfigs`.
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

      relativePath = filePath.substring(process.env.PWD.length);
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
      VelocityFixtureFiles.update(filePath, { $set: {lastModified: Date.now()}});
      VelocityTestFiles.update(filePath, { $set: {lastModified: Date.now()}});
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
   * @param {Object} config  See `_loadTestPackageConfigs`.
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
    VelocityTestReports.remove({});
    VelocityLogs.remove({});
    VelocityAggregateReports.remove({});
    VelocityAggregateReports.insert({
      name: 'aggregateResult',
      result: 'pending'
    });
    VelocityAggregateReports.insert({
      name: 'aggregateComplete',
      result: 'pending'
    });
    _.each(_testFrameworks, function (testFramework) {
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
        result;

    if (!VelocityTestReports.findOne({result: ''})) {
      failedResult = VelocityTestReports.findOne({result: 'failed'});
      result = failedResult ? 'failed' : 'passed';

      VelocityAggregateReports.update({ 'name': 'aggregateResult'}, {$set: {result: result}});
    }

    // if all test frameworks have completed, upsert an aggregate completed record
    var completedFrameworksCount = VelocityAggregateReports.find({ 'name': {$in: _testFrameworks}, 'result': 'completed'}).count();

    if (VelocityAggregateReports.findOne({'name': 'aggregateComplete'}).result !== 'completed' && _testFrameworks.length === completedFrameworksCount) {
      VelocityAggregateReports.update({'name': 'aggregateComplete'}, {$set: {'result': 'completed'}});

      _.each(_postProcessors, function (reporter) {
        reporter();
      });

    }

  }

  /**
   * Creates a physical mirror of the application under .meteor/local/.mirror
   *
   *     - Any files with the pattern tests/.*  are not copied, this stops .report
   *     directory from also being copied.
   *
   *     TODO - Strips out velocity, any test packages and reporters from the mirror's .meteor/packages file
   *
   * @method _syncMirror
   * @private
   */
  function _syncMirror () {
    var cmd = new Rsync()
      .shell('ssh')
      .flags('av')
      .set('delete')
      .set('q')
      .set('delay-updates')
      .set('force')
      .exclude('.meteor/local')
      .exclude('tests/.*')
      .source(process.env.PWD + path.sep)
      .destination(Velocity.getMirrorPath());
    var then = Date.now();
    cmd.execute(Meteor.bindEnvironment(function (error) {

      if (error) {
        DEBUG && console.error('[velocity] Error syncing mirror', error);
      } else {
        DEBUG && console.log('[velocity] rsync took', Date.now() - then);
      }

      _.each(_preProcessors, function (preProcessor) {
        preProcessor();
      });

      VelocityFixtureFiles.find({}).forEach(function (fixture) {
        var fixtureLocationInMirror = Velocity.getMirrorPath() + path.sep + path.basename(fixture.absolutePath) + path.extname(fixture.absolutePath);
        DEBUG && console.log('[velocity] copying fixture', fixture.absolutePath, 'to', fixtureLocationInMirror);
        copyFile(fixture.absolutePath, fixtureLocationInMirror);
      });

      // TODO remove this once jasmine and mocha-web are using the velocityStartMirror
      Meteor.call('velocityStartMirror', {
        name: 'mocha-web',
        port: 5000
      }, function (e, r) {
        if (e) {
          console.error('[velocity] mirror failed to start', e);
        } else {
          console.log('[velocity] Mirror started', r);
        }
      });

    }));
  }

})();
