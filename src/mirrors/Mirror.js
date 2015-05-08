/*jshint -W030 */
/* global
 DEBUG:true
 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  var _ = Npm.require('lodash'),
      url = Npm.require('url'),
      mongodbUri = Npm.require('mongodb-uri'),
      freeport = Npm.require('freeport'),
      tmp = Npm.require('tmp'),
      files = VelocityMeteorInternals.files,
      _mirrorChildProcesses = {};
  Npm.require('colors');

  // Specifies the Meteor release that we use for mirrors
  Velocity.mirrorMeteorReleaseName = 'velocity:METEOR';
  Velocity.mirrorMeteorVersion = '1.1.0.2_3';
  Velocity.mirrorMeteorRelease =
    Velocity.mirrorMeteorReleaseName + '@' + Velocity.mirrorMeteorVersion;
  Velocity.mirrorMeteorToolReleaseName = 'velocity:meteor-tool';
  Velocity.mirrorMeteorToolVersion = '1.1.3_4';
  Velocity.mirrorMeteorToolRelease =
    Velocity.mirrorMeteorToolReleaseName + '@' + Velocity.mirrorMeteorToolVersion;

////////////////////////////////////////////////////////////////////////
// Meteor Methods
//


  //////////////////////////////////////////////////////////////////////
  // Most communication with Velocity core is done via the following
  // Meteor methods.
  //
  Meteor.methods({

    /**
     * Starts a new mirror if it has not already been started, and reuses an
     * existing one if it is already started.
     *
     * This method will update the `VelocityMirrors` collection with once the mirror is ready.
     *
     * @method velocity/mirrors/request
     * @for Meteor.methods
     * @param {Object} options                  Options for the mirror.
     * @param {String} options.framework        The name of the calling framework
     * @param {String} [options.testsPath]      The path to tests for this framework.
     *                                          For example "jasmine/server/unit".
     *                                          Don't include a leading or trailing slash.
     * @param {String} [options.args]           Additional arguments that the mirror is called with
     *                                          It accepts all the options that are available for `meteor run`.
     * @param {Object} [options.env]            Additional environment variables that the mirror is called with.
     * @param {Number} [options.port]           Use a specific port.  Default is random, free port.
     * @param {String} [options.rootUrlPath]    Adds this string to the end of the root url in the
     *                                          VelocityMirrors collection. eg. `/?jasmine=true`
     * @param {Number} [options.nodes]          The number of mirrors required. This is used by
     *                                          distributable frameworks. Default is 1
     * @param {Boolean} [options.handshake]     Specifies whether or not this mirror should perform
     *                                          a DDP handshake with the parent. Distributable
     *                                          frameworks can use this to get mirrors to behave
     *                                          like workers. The default is true
     *
     */
    'velocity/mirrors/request': function (options) {
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
    },

    /**
     * Stores metadata about the mirror.
     * Before a mirror implementation starts, it needs to call
     * this method to let Velocity know it is starting up.
     *
     * @method velocity/mirrors/init
     * @param {Object} options
     *   @param {String} options.framework The name of the test framework
     *                                     making the request
     *   @param {Number} options.port The port this mirror is running on
     *   @param {String} options.mongoUrl The mongo url this mirror is using
     *   @param {String} options.host The root url of this mirror without any
     *                        additional paths. Used for making DDP connections
     *   @param {String} options.rootUrl The root url of this mirror, which also
     *                           includes the path and params
     *   @param {String} options.rootUrlPath Adds this string to the end of
     *                           the root url in the VelocityMirrors
     *                           collection. To be used by test frameworks to
     *                           recognize when they are executing in a mirror.
     *                           eg. `/?jasmine=true`
     * @param {Object} [extra] Any additional metadata the implementing mirror
     *                         would like to store in the Velocity mirrors
     *                         collection.
     */
    'velocity/mirrors/init': function (options, extra) {
      check(options, {
        framework: String,
        port: Number,
        mongoUrl: String,
        host: String,
        rootUrl: String,
        rootUrlPath: String,
        pid: Number
      });
      check(extra, Match.Optional(Object));

      if (extra) {
        _.extend(options, extra);
      }


      var _upsertQuery = {framework: options.framework};
      var _options = _.extend(options, {
        state: 'starting'
      });

      // TODO: Should we just check port for all of the frameworks?
      if (options.framework === "cucumber") {
        _upsertQuery.port = options.port;
      }

      VelocityMirrors.upsert(_upsertQuery,
        _options);
    },

    /**
     * Lets Velocity know the mirror has started successfully
     *
     * @method velocity/mirrors/register
     * @param {Object} options
     *   @param {String} options.framework The name of the test framework
     *                                     making the request
     *   @param {String} options.host The root url of this mirror without any
     *                                additional paths. Must include port. Used
     *                                for making DDP connections
     */
    'velocity/mirrors/register': function (options) {
      check(options, Match.ObjectIncluding({
        framework: String,
        host: String
      }));

      DEBUG && console.log('[velocity] Mirror registered. Handshaking with mirror...');

      this.unblock();

      // TODO: Should the host really include the port?
      var mirrorConnection = DDP.connect(options.host, {
        // Don't show the user connection errors when not in debug mode.
        // We will normally eventually connect to the mirror after
        // a connection error has been shown.
        _dontPrintErrors: !DEBUG
      });
      mirrorConnection.onReconnect = function () {
        DEBUG && console.log('[velocity] Connected to mirror, setting state to ready', options);
        mirrorConnection.call('velocity/parentHandshake', function(e, r) {
          DEBUG && console.log('[velocity] Parent Handshake response', e, r);
        });
        mirrorConnection.disconnect();

        var _updateQuery = {
          framework: options.framework,
          port: parseInt(options.port)
        };
        VelocityMirrors.update(_updateQuery, {
          $set: {
            state: 'ready',
            lastModified: Date.now()
          }
        });

      };
    },

    /**
     * Exposes the IS_MIRROR flag.
     *
     * @method velocity/isMirror
     * @for Meteor.methods
     * @return {Boolean} true if currently running in mirror
     */
    'velocity/isMirror': function () {
      return !!process.env.IS_MIRROR;
    }

  });  // end Meteor methods



//////////////////////////////////////////////////////////////////////
// Private functions
//

  function _startMirrors (options) {
    options = _.extend({
      nodes: 1
    }, options);
    DEBUG && console.log('[velocity]', options.nodes, 'mirror(s) requested');

    // only respect a provided port if a single mirror is requested
    if (options.port && options.nodes === 1) {
      _startMirror(options);
    } else {
      var startWithFreePort = Meteor.bindEnvironment(function (err, port) {
        options.port = port;
        _startMirror(options);
      });

      for (var i = 0; i < options.nodes; i++) {
        freeport(startWithFreePort);
      }
    }
  }

  function _startMirror (options) {

    // TODO, options is passed as a reference, maybe we should pass a copy instead

    options.handshake = options.handshake === undefined ? true : options.handshake;
    options.rootUrlPath = (options.rootUrlPath || '');
    options.host = _getMirrorUrl(options.port);
    options.rootUrl = options.host;

    var environment = _getEnvironmentVariables(options);

    var mirrorChild = _getMirrorChild(environment.FRAMEWORK);
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

    console.log("mirrorChild spawn command:", command, " args: ", args);
    //console.log("environment ", environment);
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
        '[velocity] This takes a few minutes the first time.'.yellow
      );
    }

    console.log(('[velocity] You can see the mirror logs at: tail -f ' +
    files.convertToOSPath(files.pathJoin(Velocity.getAppPath(),
      '.meteor', 'local', 'log', environment.FRAMEWORK + '.log'))).yellow);

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

  function _getMirrorChild (framework) {
    var mirrorChild = _mirrorChildProcesses[framework];
    if (!mirrorChild || framework === "cucumber") {
      mirrorChild = new sanjo.LongRunningChildProcess(framework);
      _mirrorChildProcesses[framework] = mirrorChild;
    }
    return mirrorChild;
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
    var parts = mongodbUri.parse(process.env.MONGO_URL);
    parts.database = database;
    return mongodbUri.format(parts);
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
   *                           the root url in the VelocityMirrors
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

  var _generateSettingsFile = _.memoize(function () {
    var tmpObject = tmp.fileSync();
    files.writeFile(tmpObject.name, JSON.stringify(Meteor.settings));
    return tmpObject.name;
  });


})();
