/*jshint -W030 */
/* global
 DEBUG:true
 */

// empty class for mirror implementations to extend
Velocity.Mirror = {};

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
      url = Npm.require('url');

//////////////////////////////////////////////////////////////////////
// Public Methods
//

  _.extend(Velocity.Mirror, {

    // TODO This can be extended to support multiple mirror types, but just one for now until we
    // get the API right
    start: function() {
      throw new Error('Mirror requested but a mirror has not been implemented');
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
     * Starts a new mirror if it has not already been started, and reuses an
     * existing one if it is already started.
     *
     * This method will update the `VelocityMirrors` collection with once the mirror is ready.
     *
     * @method velocity/mirrors/request
     *
     * @param {Object} options                  Options for the mirror.
     * @param {String} options.framework        The name of the calling framework
     * @param {String} [options.port]           String use a specific port
     * @param {String} [options.rootUrlPath]    Adds this string to the end of the root url in the
     *                                          VelocityMirrors collection. eg. `/?jasmine=true`
     *                 [options.mirrorId]       An id for this mirror that will be stored in the
     *                                          VelocityMirrors collection and also available as
     *                                          MIRROR_ID environment var from the mirror.
     *                                          If not provided, this will be set to a random
     *                                          mongo-style id.
     *
     * @return {String}   The mirrorId. Frameworks can wait for this mirrorId to be ready should
     *                    they need to.
     *
     */
    'velocity/mirrors/request': function (options) {
      check(options, {
        framework: String,
        port: Match.Optional(Number),
        rootUrlPath: Match.Optional(String)
      });

      options.mirrorId = options.mirrorId || Random.id();

      _startOrReuseMirror(options);

      return options.mirrorId;
    },

    /**
     * Stores metadata about the mirror. Before a mirror implementation starts, it needs to call
     * this method to let Velocity know it is starting up.
     *
     * @param options {Object}
     *            Required fields
     *                mirrorId  : the ID of this mirror. This is provided to mirrors in the
     *                            startOrReuseMirror call in this class
     *                port      : the port this mirror is running on
     *                mongoUrl  : the mongo url this mirror is using
     *                rootUrl   : the root url of this mirror, which also includes the path and params
     *                type      : eg 'node-soft-mirror' or 'meteor-soft-mirror'
     * @param extra {Object}    Any additional metadata the implementing mirror would like to store
     *                          in the Velocity mirrors collection. This is optional.
     *
     */
    'velocity/mirrors/init': function (options, extra) {
      check(options, {
        mirrorId: String,
        port: Number,
        mongoUrl: String,
        rootUrl: String,
        type: String
      });

      if(extra) {
        _.extend(options, extra);
      }

      VelocityMirrors.insert(_.extend(options, {
        _id: options.mirrorId,
        reused: false,
        state: 'starting'
      }));
    },

    /**
     * Lets Velocity know the mirror has started successfully
     *
     * @param options
     *            Required fields
     *                mirrorId  : the ID this mirror was given by
     *                port      : the port this mirror is running on
     */
    'velocity/mirrors/register': function (options) {

      DEBUG && console.log('[velocity] Mirror registered with', options);

      VelocityMirrors.update({
        framework: options.framework,
        port: parseInt(options.port)
      }, {
        $set: {
          state: 'ready'
        }
      });
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


  /**
   * Starts a new mirror if one is not found. The criteria to reuse a mirror is that the requested
   * mirror and an existing mirror share the same port. If the same port is found, a new entry in
   * the mirrors collection is added with the new metadata but the same port. If a mirror is reused,
   * the metadata in the VelocityMirrors will have the property 'reused' set to true.
   *
   * @method startOrReuseMirror
   * @param {Object} options
   *                Required fields:
   *                   framework - String ex. 'mocha-web-1'
   *                   rootUrlPath - String ex. '/x=y'
   *                   port - a specific port to start the mirror on
   *                   mirrorId - the ID this miror was given in the requestMirror call
   *
   * @private
   */
  function _startOrReuseMirror (options) {

    options.port = options.port || process.env.DEFAULT_MIRROR_PORT || 5000;
    var rootUrlPath = (options.rootUrlPath || '').replace(/\//, '');
    options.rootUrl = _getMirrorUrl(options.port) + rootUrlPath;

    DEBUG && console.log('[velocity] Mirror requested', options);

    var mirrorWithSamePort = VelocityMirrors.findOne({port: parseInt(options.port)});
    if (mirrorWithSamePort && mirrorWithSamePort.framework !== options.framework) {
      // the ports only match, which means this is a new framework reusing an existing mirror
      delete mirrorWithSamePort._id;
      mirrorWithSamePort.framework = options.framework;
      mirrorWithSamePort.rootUrlPath = options.rootUrlPath;
      mirrorWithSamePort.reused = true;
      VelocityMirrors.insert(mirrorWithSamePort);
    } else if (!mirrorWithSamePort) {
      // delegate the mirror start to the framework-chose mirror choice
      Velocity.Mirror.start(options, _getEnvironmentVariables(options));
    }
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
   * Return the environment variables that a mirror should run with
   * @param {Object} options Required fields:
   *                   framework - String ex. 'mocha-web-1'
   *                   rootUrl - String ex. 'http://localhost:5000/x=y'
   *                   port - a specific port
   * @returns {string} Mirror URL
   * @private
   */
  function _getEnvironmentVariables (options) {
    // perhaps we can copy the meteor environment directly here?
    return {
      NODE_ENV: process.env.NODE_ENV,
      DEBUG: DEBUG,
      PORT: options.port,
      ROOT_URL: options.rootUrl,
      MONGO_URL: _getMongoUrl(options.framework),
      PARENT_URL: process.env.ROOT_URL,
      MIRROR_ID: options.mirrorId,
      IS_MIRROR: true,
      METEOR_SETTINGS: JSON.stringify(_.extend({}, Meteor.settings))
    };
  }


})();
