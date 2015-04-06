/*jshint -W030 */
/* global
 DEBUG:true
 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {
  'use strict';

  if (process.env.NODE_ENV !== 'development' || !process.env.IS_MIRROR) {
    DEBUG && console.log('[velocity] Not adding mirror-registrar because NODE_ENV is',
      process.env.NODE_ENV, 'and IS_MIRROR is', !!process.env.IS_MIRROR);
    return;
  }

  // between this line and the velocity/parentHandshake, is the time the mirror starts initializing
  // and is ready
  console.log('[velocity] Starting mirror on port', process.env.MIRROR_PORT);

  Meteor.methods({

    /**
     * Meteor method: velocity/isMirror
     * Exposes the IS_MIRROR flag to mirror clients
     *
     * @method velocity/isMirror
     */
    'velocity/isMirror': function () {
      return !!process.env.IS_MIRROR;
    },

    /**
     * Meteor method: velocity/parentHandshake
     * This is the best indicator of the mirror's ready status, so it's used to inform the user
     * when there may be delays
     *
     * @method velocity/isMirror
     */
    'velocity/parentHandshake': function () {
      console.log('[velocity] Mirror requested by ' + process.env.FRAMEWORK + ' is ready.');
    }
  });

  /**
   * This code will run inside a mirror and connects the mirror to velocity via ddp once the mirror
   * starts. Velocity will then inform frameworks this mirror is ready.
   */
  Meteor.startup(function () {

    if (!process.env.HANDSHAKE) {
      DEBUG && console.log('[velocity] Mirror', process.env.MIRROR_PORT , 'configured not to handshake');
      return;
    }

    DEBUG && console.log('[velocity] Mirror started. Connecting via DDP to parent');

    var velocityConnection = DDP.connect(process.env.PARENT_URL);
    velocityConnection.onReconnect = function () {
      DEBUG && console.log('[velocity] Mirror connected to parent. Registering mirror...');
      velocityConnection.call('velocity/mirrors/register', {
        framework: process.env.FRAMEWORK,
        port: process.env.MIRROR_PORT,
        host: process.env.HOST
      }, function (error) {
        if (error) {
          console.error(
            '[velocity] Could not connect to parent via DDP. ' +
            'Please restart your app and try again. ' +
            'If this happens often please report it as issue to velocity:core.',
            error
          );
        }
        // Disconnect because we no longer need the connection
        velocityConnection.disconnect();
      });
    };

  });


})();
