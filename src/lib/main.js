"use strict";

var _ = Npm.require('lodash'),
    fs = Npm.require('fs'),
    path = Npm.require('path'),
    chokidar = Npm.require('chokidar'),
    DEBUG = !!process.env.VELOCITY_DEBUG,
    VELOCITY_CONFIG_FILE = 'velocity.json',
    defaultConfig = {
      frameworks: ['jasmine-unit', 'mocha-web'],
      regex: '.(js|coffee)',
      testDirs: ['tests']
    },
    _config,
    watcher;


DEBUG && console.log('PWD', process.env.PWD);

_config = _loadConfig();
DEBUG && console.log('velocity config =', JSON.stringify(_config, null, 2));

// kick-off everything
_reset(_config);



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
   *                   framework: "jasmine-unit",
   *                   notIn: ['tests/auth-jasmine-unit.js']
   *                 }
   */
  resetReports: function (options) {
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
    var requiredFields = ['type', 'message', 'framework']

    _checkRequired (requiredFields, options);

    VelocityLogs.insert({
      timestamp: options.timestamp ? options.timestamp : Date.now(),
      type: options.type,
      message: options.message,
      framework: options.framework
    });
  },

  /**
   * Meteor method: postResult
   * 
   * @method postResult
   * @param {Object} options Required parameters:
   *                   id - String
   *                   name - String
   *                   framework - String  ex. 'jasmine-unit'
   *                   result - String
   *                 
   *                 Suggested optional parameters:
   *                   timestamp - Date
   *                   time
   *                   async
   *                   timeOut
   *                   pending
   *                   failureType
   *                   failureMessage
   *                   failureStackTrace
   *                   ancestors
   */
  postResult: function (options) {
    var requiredFields = ['id', 'name', 'framework', 'result'],
        data = {};

    options = options || {};

    _checkRequired (requiredFields, options);

    for (var fieldName in options) {
      data[fieldName] = options[fieldName];
    }

    VelocityTestReports.upsert(options.id, {$set: data});
    _updateAggregateReports();
  }  // end postResult

});  // end Meteor methods




//////////////////////////////////////////////////////////////////////
// Private functions
//

/**
 * Ensures that each require field is found on the target object.
 * Throws exception if a required field is undefined, null or an empty string.
 *
 * @method _checkRequired
 * @param {Array} requiredFields - list of required field names
 * @param {Object} target - target object to check
 * @private
 */
function _checkRequired (requiredFields, target) {
  _.each(requiredFields, function (name) {
    if (!target[name]) {
      throw new Error("Required field '" + name + "' is missing." +
                      "Result not posted.")
    }
  })
}

/**
 * Attempts to load velocity configuration information.
 * First checks for a `velocity.json` file in the app directory.
 * Then checks `Meteor.settings.velocity`.  Then uses the default config
 * if none of the others are found.
 *
 * NOTE: Contents of this config are subject to frequent change until
 *       `velocity`s design is more stable. 
 *
 * @example
 *     {
 *       "frameworks": ["jasmine-unit", "mocha-web"],
 *       "regex": ".(js|coffee)",
 *       "testDirs": ["tests"]
 *     }
 * 
 * @method _loadConfig
 * @return {Object} the configuration object
 * @private
 */
function _loadConfig () {
  var config,
      velocityConfigFile,
      Meteor = Meteor || {settings: {}};

  velocityConfigFile = path.join(process.env.PWD, VELOCITY_CONFIG_FILE);

  try {
    config = fs.readFileSync(velocityConfigFile).toString();
    config = JSON.parse(config);
    DEBUG && console.log("Checking for velocity config file '",
                          VELOCITY_CONFIG_FILE, "'...found!");
  } 
  catch (ex) { 
    DEBUG && console.log(ex);
    DEBUG && console.log("Checking for velocity config file '",
                          VELOCITY_CONFIG_FILE, "'...not found");
  }

  if (!config) {
    config = Meteor.settings.velocity;
    if (config) {
      DEBUG && console.log('  checking Meteor.settings.velocity...found!');
    } else {
      DEBUG && console.log('  checking Meteor.settings.velocity...not found');
    }
  }

  if (!config) {
    DEBUG && console.log('  using default velocity config');
    config = defaultConfig;
  }

  return config;
}  // end _loadConfig


 
/**
 * Initialize the directory/file watcher.
 *
 * @method _initWatcher
 * @param {Object} config  See `_loadConfig`.
 * @private
 */
function _initWatcher (config) {
  var absoluteTestDirs,
      _watcher,
      testFileRegex = '-(' + config.frameworks.join('|') + ')' + 
                      config.regex;
  
  DEBUG && console.log('Velocity testFileRegex', testFileRegex);

  absoluteTestDirs = _.map(config.testDirs, function (testDir) {
    return path.join(process.env.PWD, testDir);
  });

  _watcher = chokidar.watch(absoluteTestDirs, {ignored: /[\/\\]\./});


  _watcher.on('add', Meteor.bindEnvironment(function (filePath) {
    var relativePath,
        filename,
        targetFramework,

    filePath = path.normalize(filePath);

    DEBUG && console.log('File added:', filePath);

    filename = path.basename(filePath);

    if (filename.match(testFileRegex)) {
      targetFramework = _.filter(config.frameworks, function (framework) {
        return filename.match('-' + framework + config.regex);
      })[0];

      DEBUG && console.log(targetFramework, ' <= ', filePath)

      relativePath = filePath.substring(process.env.PWD.length);
      if (relativePath[0] === path.sep) {
        relativePath = relativePath.substring(1)
      }

      VelocityTestFiles.insert({
        _id: filePath,
        name: filename,
        absolutePath: filePath,
        relativePath: relativePath,
        targetFramework: targetFramework,
        lastModified: Date.now()
      });
    }
  }));  // end watcher.on 'add'

  _watcher.on('change', Meteor.bindEnvironment(function (filePath) {
    DEBUG && console.log('File changed:', filePath);

    // Since we key on filePath and we only add files we're interested in,
    // we don't have to worry about inadvertently updating records for files
    // we don't care about.
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

  return _watcher;
}  // end _initWatcher 


/**
 * Re-init file watcher and clear all test results.
 *
 * @method _reset
 * @param {Object} config  See `_loadConfig`.
 * @private
 */
function _reset (config) {
  if (watcher) {
    watcher.close();
  }

  VelocityTestFiles.remove({});
  VelocityTestReports.remove({});
  VelocityAggregateReports.remove({});
  VelocityAggregateReports.insert({
    _id: 'result',
    name: 'Aggregate Result',
    result: 'pending'
  });

  watcher = _initWatcher(config);
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
    failedResult = VelocityTestReports.findOne({result: 'failed'})
    result = failedResult ?  'failed' : 'passed'

    VelocityAggregateReports.update('result', {$set: {result: result}});
  }
}
