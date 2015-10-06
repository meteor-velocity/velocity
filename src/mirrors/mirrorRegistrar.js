/* globals
 DEBUG: true,
 WebApp: false
 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////
  // This code will run inside a mirror and connects the mirror to
  // velocity via ddp once the mirror starts. Velocity will then
  // inform frameworks this mirror is ready.
  //
  if (process.env.IS_MIRROR) {
    if (process.env.HANDSHAKE) {
      WebApp.onListening(function () {
        Meteor.defer(function handshakeWithParent() {
          DEBUG && console.log('[velocity] Mirror started. Connecting via DDP to parent');
          var velocityConnection = DDP.connect(process.env.PARENT_URL, {
            onConnected: function () {
              DEBUG && console.log('[velocity] Mirror connected to parent. Registering mirror...');
              velocityConnection.call('velocity/mirrors/register', {
                framework: process.env.FRAMEWORK,
                host: process.env.HOST,
                port: process.env.MIRROR_PORT
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
            }
          });
        });
      });
    } else {
      DEBUG && console.log('[velocity] Mirror', process.env.MIRROR_PORT , 'configured not to handshake');
    }
  }

})();
