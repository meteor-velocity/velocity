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

  Meteor.methods({

    /**
     * Meteor method: velocity/isMirror
     * Exposes the IS_MIRROR flag to mirror clients
     *
     * @method velocity/isMirror
     */
    'velocity/isMirror': function () {
      return !!process.env.IS_MIRROR;
    }
  });

  /**
   * This code will run inside a mirror and connects the mirror to velocity via ddp once the mirror
   * starts. Velocity will then inform frameworks this mirror is ready.
   */
  Meteor.startup(function () {

    DEBUG && console.log('[velocity] Mirror started. Connecting via DDP to parent');

    var velocityConnection = DDP.connect(process.env.PARENT_URL);
    velocityConnection.onReconnect = function () {
      DEBUG && console.log('[velocity] Mirror connected to parent. Registering mirror...');
      velocityConnection.call('velocity/mirrors/register', {
        framework: process.env.FRAMEWORK,
        port: process.env.PORT,
        host: process.env.HOST
      });
    };

  });


})();
