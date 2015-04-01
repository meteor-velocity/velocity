/*jshint -W030 */
/* global
 DEBUG:true
 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  if (process.env.NODE_ENV !== 'development' ||
    process.env.IS_MIRROR) {
    DEBUG && console.log('[velocity] Not adding mirror-registry because NODE_ENV is',
      process.env.NODE_ENV, ' and IS_MIRROR is', process.env.IS_MIRROR);
    return;
  }

  var _ = Npm.require('lodash'),
      url = Npm.require('url'),
      mongodbUri = Npm.require('mongodb-uri'),
      freeport = Npm.require('freeport'),
      _mirrorChildProcesses = {};


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
     * Starts a new mirror if it has not already been started, and reuses an
     * existing one if it is already started.
     *
     * This method will update the `VelocityMirrors` collection with once the mirror is ready.
     *
     * @method velocity/mirrors/request
     *
     * @param {Object} options                  Options for the mirror.
     * @param {String} options.framework        The name of the calling framework
     * @param {String} options.testsPath        The path to tests for this framework.
     *                                          For example "jasmine/server/unit".
     *                                          Don't include a leading or trailing slash.
     * @param {String} [options.port]           String use a specific port
     * @param {String} [options.rootUrlPath]    Adds this string to the end of the root url in the
     *                                          VelocityMirrors collection. eg. `/?jasmine=true`
     * @param {String} [options.nodes]          The number of mirrors required. This is used by
     *                                          distributable frameworks. Default is 1
     * @param {String} [options.handshake]      Specifies whether or not this mirror should perform
     *                                          a DDP handshake with the parent. Distributable
     *                                          frameworks can use this to get mirrors to behave
     *                                          like workers. The default is true
     *
     */
    'velocity/mirrors/request': function (options) {
      check(options, {
        framework: String,
        testsPath: String,
        port: Match.Optional(Number),
        rootUrlPath: Match.Optional(String),
        nodes: Match.Optional(Number),
        handshake: Match.Optional(Boolean)
      });
      _startMirrors(options);
    },

    /**
     * Stores metadata about the mirror.
     * Before a mirror implementation starts, it needs to call
     * this method to let Velocity know it is starting up.
     *
     * @param options {Object}
     *            Required fields
     *                port      : the port this mirror is running on
     *                mongoUrl  : the mongo url this mirror is using
     *                host      : the root url of this mirror without any additional paths. Used for
     *                            making DDP connections
     *                rootUrl   : the root url of this mirror, which also includes the path and params
     *                type      : eg 'node-soft-mirror' or 'meteor-soft-mirror'
     * @param extra {Object}    Any additional metadata the implementing mirror would like to store
     *                          in the Velocity mirrors collection. This is optional.
     *
     */
    'velocity/mirrors/init': function (options, extra) {
      check(options, {
        port: Number,
        framework: String,
        mongoUrl: String,
        host: String,
        rootUrl: String,
        rootUrlPath: String,
        type: String
      });
      check(extra, Match.Optional(Object));

      if (extra) {
        _.extend(options, extra);
      }

      VelocityMirrors.upsert({framework: options.framework},
        _.extend(options, {
          state: 'starting'
        }));
    },

    /**
     * Lets Velocity know the mirror has started successfully
     *
     * @param options
     *            Required fields
     *                framework  : the framework the mirror was requested by
     *                host      : the host the mirror is running on
     *                port      : the port the mirror is running on
     */
    'velocity/mirrors/register': function (options) {
      check(options, Match.ObjectIncluding({
        framework: String,
        host: String,
        port: Match.OneOf(Number, String)
      }));

      DEBUG && console.log('[velocity] Mirror registered. Handshaking with mirror...');

      // Ugliness! It seems the DDP connect has a exponential back-off, which means the tests take
      // around 5 seconds to rerun. This setTimeout helps.
      Meteor.setTimeout(function () {
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
          VelocityMirrors.update({
            framework: options.framework
          }, {
            $set: {
              state: 'ready',
              lastModified: Date.now()
            }
          });
        };
      }, 300);



    },

    /**
     * Exposes the IS_MIRROR flag to clients
     *
     * @method velocity/isMirror
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
    options.handshake = options.handshake === undefined ? true : options.handshake;
    options.rootUrlPath = (options.rootUrlPath || '');
    options.host = _getMirrorUrl(options.port);
    options.rootUrl = options.host;

    var environment = _getEnvironmentVariables(options);
    var args = [
      'run',
      '--test-app',
      '--port', String(environment.PORT),
      '--include-tests', options.testsPath
    ];

    // Allow to use checked out meteor for spawning mirrors
    // for development on our Meteor fork
    if (!process.env.VELOCITY_USE_CHECKED_OUT_METEOR) {
      args.push('--release', 'velocity:METEOR@1.1.0_1');
    }

    var mirrorChild = _getMirrorChild(environment.FRAMEWORK);
    if (mirrorChild.isRunning()) {
      return;
    }

    mirrorChild.spawn({
      command: 'meteor',
      args: args,
      options: {
        cwd: process.env.VELOCITY_APP_PATH || process.env.PWD,
        env: environment
      }
    });

    DEBUG && console.log(
      '[velocity-node-mirror] Mirror process forked with pid',
      mirrorChild.getPid()
    );

    Meteor.call('velocity/mirrors/init', {
      framework: environment.FRAMEWORK,
      port: environment.PORT,
      mongoUrl: environment.MONGO_URL,
      host: environment.HOST,
      rootUrl: environment.ROOT_URL,
      rootUrlPath: environment.ROOT_URL_PATH,
      type: 'meteor-mirror'
    }, {
      pid: mirrorChild.getPid()
    });
  }

  function _getMirrorChild (framework) {
    var mirrorChild = _mirrorChildProcesses[framework];
    if (!mirrorChild) {
      mirrorChild = new sanjo.LongRunningChildProcess(framework);
      _mirrorChildProcesses[framework] = mirrorChild;
    }
    return mirrorChild;
  }

  /**
   * Returns the MongoDB URL for the given database.
   * @param database
   * @return {string} MongoDB Url
   * @private
   */
  function _getMongoUrl (database) {
    var parts = mongodbUri.parse(process.env.MONGO_URL);
    parts.database = database;
    return mongodbUri.format(parts);
  }

  /**
   * Return URL for the mirror with the given port.
   * @param port Mirror port
   * @return {string} Mirror URL
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
   * @param {Object} options Required fields:
   *                   framework - String ex. 'mocha-web-1'
   *                   rootUrl - String ex. 'http://localhost:5000/x=y'
   *                   port - a specific port
   * @returns {string} Mirror URL
   * @private
   */
  function _getEnvironmentVariables (options) {
    return _.defaults({
      PORT: options.port,
      HOST: options.host,
      ROOT_URL_PATH: options.rootUrlPath,
      ROOT_URL: options.rootUrl,
      FRAMEWORK: options.framework,
      MONGO_URL: _getMongoUrl(options.framework),
      PARENT_URL: process.env.ROOT_URL,
      IS_MIRROR: true,
      HANDSHAKE: options.handshake,
      METEOR_SETTINGS: JSON.stringify(_.extend({}, Meteor.settings))
    }, process.env);
  }


})();
