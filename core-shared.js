/*jshint -W117 */
/* global
 Velocity:true
 */

Velocity = Velocity || {};

(function () {
  'use strict';

//////////////////////////////////////////////////////////////////////
// Public Methods
//
  
    /**
     * Mirrors can share the same codebase as the main process. This method will run provided code
     * inside a mirror only.
     *
     * where: client / server
     *
     * @method onTest
     * @param {Function} code
     *
     */
    Velocity.onTest = function (code) {
      Meteor.call('velocity/isMirror', function (err, res) {
        if (res) {
          code();
        }
      });
    };

})();
