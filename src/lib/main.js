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
    config,
    watcher;


DEBUG && console.log('PWD', process.env.PWD);

config = _loadConfig();
DEBUG && console.log('velocity config =', JSON.stringify(config, null, 2));

// kick-off everything
_reset();



//////////////////////////////////////////////////////////////////////
// Meteor Methods
//

Meteor.methods({

  reset: function () {
    _reset();
  },

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

  postLog: function (options) {
    if (!options || !options.type || !options.message || !options.framework) {
      throw new Error('type, message and framework are required fields.')
    }
    VelocityLogs.insert({
      timestamp: options.timestamp ? options.timestamp : Date.now(),
      type: options.type,
      message: options.message,
      framework: options.framework
    });
  },

  postResult: function (options) {
    var requiredFields = ['id', 'name', 'framework', 'result'],
        optionalFields = [
          'timestamp',
          'time',
          'async',
          'timeOut',
          'pending',
          'failureType',
          'failureMessage',
          'failureStackTrace',
          'ancestors'
        ],
        result;

    options = options || {};

    _checkRequired (requiredFields, options);

    result = {
      name: options.name,
      framework: options.framework,
      result: options.result
    };

    _.each(optionalFields, function (option) {
      result[option] = options[option] ? options[option] : '';
    });

    VelocityTestReports.upsert(options.id, {$set: result});
    _updateAggregateReports();
  }  // end postResult

});  // end Meteor methods




//////////////////////////////////////////////////////////////////////
// Private functions
//

function _checkRequired (requiredFields, target) {
  _.each(requiredFields, function (name) {
    if (!target[name]) {
      throw new Error("Required field '" + name + "' is missing." +
                      "Result not posted.")
    }
  })
}

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


 
function _initWatcher () {
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
    'use strict';

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
    _reset();
  }));

  return _watcher;
}  // end _initWatcher 


function _reset () {
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

  watcher = _initWatcher();
}

function _updateAggregateReports () {
  var failedResult,
      result;

  if (!VelocityTestReports.findOne({result: ''})) {
    failedResult = VelocityTestReports.findOne({result: 'failed'})
    result = failedResult ?  'failed' : 'passed'

    VelocityAggregateReports.update('result', {$set: {result: result}});
  }
}
