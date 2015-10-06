/* globals DEBUG: true, _: true */

var DEBUG = !!process.env.VELOCITY_DEBUG;
var _ = Npm.require('lodash');
var url = Npm.require('url');
var mongodbUri = Npm.require('mongodb-uri');
var freeport = Npm.require('freeport');
var tmp = Npm.require('tmp');
var files = VelocityMeteorInternals.files;
var _mirrorChildProcesses = {};
Npm.require('colors');


// Specifies the Meteor release that we use for mirrors
Velocity.mirrorMeteorReleaseName = 'velocity:METEOR';
Velocity.mirrorMeteorVersion = '1.2.0.2_1';
Velocity.mirrorMeteorRelease = process.env.VELOCITY_MIRROR_METEOR_RELEASE ||
  Velocity.mirrorMeteorReleaseName + '@' + Velocity.mirrorMeteorVersion;
Velocity.mirrorMeteorToolReleaseName = 'velocity:meteor-tool';
Velocity.mirrorMeteorToolVersion = '1.1.9_1';
Velocity.mirrorMeteorToolRelease = process.env.VELOCITY_MIRROR_METEOR_TOOL_RELEASE ||
  Velocity.mirrorMeteorToolReleaseName + '@' + Velocity.mirrorMeteorToolVersion;


/**
 * Starts a new mirror if it has not already been started, and reuses an
 * existing one if it is already started.
 *
 * This method will update the `Velocity.Collections.Mirrors` collection with once the mirror is ready.
 *
 * @method velocity/mirrors/request
 * @for Meteor.methods
 * @param {Object} options                  Options for the mirror.
 * @param {String} options.framework        The name of the calling framework
 * @param {String} [options.testsPath]      The path to tests for this framework.
 *                                          For example 'jasmine/server/unit'.
 *                                          Don't include a leading or trailing slash.
 * @param {String} [options.args]           Additional arguments that the mirror is called with
 *                                          It accepts all the options that are available for `meteor run`.
 * @param {Object} [options.env]            Additional environment variables that the mirror is called with.
 * @param {Number} [options.port]           Use a specific port.  Default is random, free port.
 * @param {String} [options.rootUrlPath]    Adds this string to the end of the root url in the
 *                                          Velocity.Collections.Mirrors collection. eg. `/?jasmine=true`
 * @param {Number} [options.nodes]          The number of mirrors required. This is used by
 *                                          distributable frameworks. Default is 1
 * @param {Boolean} [options.handshake]     Specifies whether or not this mirror should perform
 *                                          a DDP handshake with the parent. Distributable
 *                                          frameworks can use this to get mirrors to behave
 *                                          like workers. The default is true
 *
 */
Velocity.Methods['velocity/mirrors/request'] = function (options) {
  check(options, {
    framework: String,
    testsPath: Match.Optional(String),
    args: Match.Optional([Match.Any]),
    env: Match.Optional(Object),
    port: Match.Optional(Number),
    rootUrlPath: Match.Optional(String),
    nodes: Match.Optional(Number),
    handshake: Match.Optional(Boolean)
  });

  this.unblock();

  _startMirrors(options);
};


function _startMirrors (options) {
  options = _.extend({
    nodes: 1
  }, options);
  DEBUG && console.log('[velocity]', options.nodes, 'mirror(s) requested');
  // only respect a provided port if a single mirror is requested
  if (options.port && options.nodes === 1) {
    _startMirror(options);
  } else {
    _reuseMirrors();
    _startUninitializedMirrorsWithFreePorts();
  }

  function _reuseMirrors() {
    options.unitializedNodes = options.nodes;
    var _reusableMirrorsForFramework = _.filter(Velocity.reusableMirrors, function(rmp) {
      return rmp.framework === options.framework && rmp.reused === false;
    });

    _reusableMirrorsForFramework.forEach(function(rmff) {
      rmff.reused = true;

      options.port = rmff.port;
      _startMirror(options);

      options.unitializedNodes--;

    });

  }

  function _startUninitializedMirrorsWithFreePorts() {
    var startWithFreePort = Meteor.bindEnvironment(function(err, port) {
      options.port = port;
      _startMirror(options);
    });

    for (var i = 0; i < options.unitializedNodes; i++) {
      freeport(startWithFreePort);
    }
  }
}


var _generateSettingsFile = _.memoize(function () {
  var tmpObject = tmp.fileSync();
  files.writeFile(tmpObject.name, JSON.stringify(Meteor.settings));
  return tmpObject.name;
});


function _startMirror (options) {

  // TODO, options is passed as a reference, maybe we should pass a copy instead

  options.handshake = options.handshake === undefined ? true : options.handshake;
  options.rootUrlPath = (options.rootUrlPath || '');
  options.host = _getMirrorUrl(options.port);
  options.rootUrl = options.host;

  var environment = _getEnvironmentVariables(options);

  // append the port to the mirror log if there are multiple mirrors
  var processName = environment.FRAMEWORK;
  if (options.nodes > 1) {
    processName = environment.FRAMEWORK + '_' + environment.PORT;
  }

  var mirrorChild = _getMirrorChild(environment.FRAMEWORK, processName);
  if (mirrorChild.isRunning()) {
    return;
  }

  var command = VelocityInternals.isWindows() ? 'meteor.bat' : 'meteor';
  var args = [
    'run',
    '--test-app',
    '--port', String(environment.PORT)
  ];

  if (options.testsPath) {
    args.push('--include-tests', files.convertToStandardPath(options.testsPath));
  }

  if (VelocityInternals.isEnvironmentVariableTrue(process.env.VELOCITY_CI, false)) {
    args.push('--once');
  }

  if (Meteor.settings) {
    var settingsPath = _generateSettingsFile();
    args.push('--settings', settingsPath);
  }

  if (options.args) {
    args.push.apply(args, options.args);
  }

  // Make it possible to debug a mirror
  if (
    process.env.VELOCITY_DEBUG_MIRROR &&
    process.env.VELOCITY_DEBUG_MIRROR === environment.FRAMEWORK &&
    !_.contains(options.args, '--debug-port')
  ) {
    var debugPort = '5858';
    args.push('--debug-port', debugPort);
    console.log('[velocity] Your mirror is now paused and ready for debugging!');
    console.log();
    console.log('[velocity] To debug the server process using a graphical debugging interface,');
    console.log('[velocity] visit this URL in your web browser:');
    console.log('[velocity] http://localhost:8080/debug?port=' + debugPort);
  }

  // Allow to use checked out meteor for spawning mirrors
  // for development on our Meteor fork
  if (!process.env.VELOCITY_USE_CHECKED_OUT_METEOR) {
    args.push('--release', Velocity.mirrorMeteorRelease);
  }

  mirrorChild.spawn({
    command: command,
    args: args,
    options: {
      cwd: process.env.VELOCITY_APP_PATH || process.env.PWD,
      env: environment
    }
  });

  DEBUG && console.log(
    '[velocity] Mirror process forked with pid',
    mirrorChild.getPid()
  );


  console.log(('[velocity] ' +
    environment.FRAMEWORK + ' is starting a mirror at ' +
    environment.ROOT_URL + '.'
  ).yellow);

  var isMeteorToolInstalled = MeteorFilesHelpers.isPackageInstalled(
    Velocity.mirrorMeteorToolReleaseName,
    Velocity.mirrorMeteorToolVersion
  );
  if (!isMeteorToolInstalled) {
    console.log(
      '[velocity] *** Meteor Tools is installing ***',
      '\nThis takes a few minutes the first time.'.yellow
    );
  }

  console.log(('[velocity] You can see the mirror logs at: tail -f ' +
  files.convertToOSPath(files.pathJoin(Velocity.getAppPath(),
    '.meteor', 'local', 'log', processName + '.log'))).yellow);

  Meteor.call('velocity/mirrors/init', {
    framework: environment.FRAMEWORK,
    port: environment.PORT,
    mongoUrl: environment.MONGO_URL,
    host: environment.HOST,
    rootUrl: environment.ROOT_URL,
    rootUrlPath: environment.ROOT_URL_PATH,
    pid: mirrorChild.getPid()
  });
}


/**
 * Return URL for the mirror with the given port.
 *
 * @method _getMirrorUrl
 * @param {Number} port Mirror port
 * @return {String} Mirror URL
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
 * Return the environment variables that a mirror should run with
 *
 * @method _getEnvironmentVariables
 * @param {Object} options Required fields:
 *   @param {String} options.framework The name of the test framework
 *                                     making the request
 *   @param {Number} options.port The port this mirror is running on
 *   @param {String} options.host The root url of this mirror without any
 *                        additional paths. Used for making DDP connections
 *   @param {String} options.rootUrl The root url of this mirror, which also
 *                           includes the path and params
 *   @param {String} options.rootUrlPath Adds this string to the end of
 *                           the root url in the Velocity.Collections.Mirrors
 *                           collection. To be used by test frameworks to
 *                           recognize when they are executing in a mirror.
 *                           eg. `/?jasmine=true`
 *   @param {Boolean} options.handshake Specifies whether or not this mirror
 *                                      should perform a DDP handshake with
 *                                      the parent. Distributable frameworks
 *                                      can use this to get mirrors to behave
 *                                      like workers.
 *   @param {Object} [options.env] Additional environment variables that the
 *                                 mirror is called with.
 * @return {Object} environment variables
 * @private
 */
function _getEnvironmentVariables (options) {
  var env = {
    PORT: options.port,
    // PORT gets overridden by Meteor so we save the mirror port in
    // MIRROR_PORT too.
    MIRROR_PORT: options.port,
    HOST: options.host,
    ROOT_URL_PATH: options.rootUrlPath,
    ROOT_URL: options.rootUrl,
    FRAMEWORK: options.framework,
    MONGO_URL: _getMongoUrl(options.framework),
    PARENT_URL: process.env.ROOT_URL,
    IS_MIRROR: true,
    HANDSHAKE: options.handshake,
    VELOCITY_MAIN_APP_PATH: Velocity.getAppPath(),
    METEOR_SETTINGS: JSON.stringify(_.extend({}, Meteor.settings))
  };

  if (options.env) {
    _.defaults(env, options.env);
  }

  _.defaults(env, process.env);

  return env;
}


/**
 * Returns the MongoDB URL for the given database.
 *
 * @method _getMongoUrl
 * @param {Object} database
 * @return {String} MongoDB Url
 * @private
 */
function _getMongoUrl (database) {
  var parts = mongodbUri.parse(process.env.VELOCITY_MONGO_URL || process.env.MONGO_URL);
  parts.database += '-' + database;
  return mongodbUri.format(parts);
}


function _getMirrorChild (framework, processName) {
  var _processName = processName || framework;
  var mirrorChild = _mirrorChildProcesses[_processName];
  if (!mirrorChild) {
    mirrorChild = new sanjo.LongRunningChildProcess(_processName);
    _mirrorChildProcesses[_processName] = mirrorChild;
  }
  return mirrorChild;
}
