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


    Meteor.methods({
      /**
       * Set a option.
       * @param name The name of the option.
       * @param value The value of the option.
       */
      'velocity/setOption': function (name, value) {
        check(name, String);
        check(value, Match.Any);

        VelocityOptions.upsert(
          {_id: name},
          {$set: {name: name, value: value}}
        );
      },

      /**
       * Get a option
       * @param name The name of the option.
       * @returns {*} The value of the option or null.
       */
      'velocity/getOption': function (name) {
        check(name, String);

        var option = VelocityOptions.findOne({name: name});
        return option ? option.value : null;
      }
    });
})();
