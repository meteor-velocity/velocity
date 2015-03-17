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

    if (Meteor.isServer) {
      /**
       * @method
       * @see velocity/setOption
       */
      Velocity.setOption = function (name, value) {
        Meteor.call('velocity/setOption', name, value);
      };

      /**
       * @see velocity/setOptions
       */
      Velocity.setOptions = function (options) {
        Meteor.call('velocity/setOptions', options);
      };

      /**
       * @see velocity/getOption
       */
      Velocity.getOption = function (name) {
        Meteor.call('velocity/getOption', name);
      };
    }

    Meteor.methods({
      /**
       * Set a option.
       * @method velocity/setOption
       * @param name The name of the option.
       * @param value The value of the option.
       */
      'velocity/setOption': function (name, value) {
        check(name, String);
        check(value, Match.Any);

        VelocityOptions.upsert(
          {name: name},
          {$set: {name: name, value: value}}
        );
      },

      /**
       * Set multiple options.
       * @method velocity/setOptions
       * @param options Hash with options (name: value).
       */
      'velocity/setOptions': function (options) {
        check(options, Object);

        for (var name in options) {
          if (options.hasOwnProperty(name)) {
            Meteor.call('velocity/setOption', name, options[name]);
          }
        }
      },

      /**
       * Get a option
       * @method velocity/getOption
       * @param name The name of the option.
       * @returns {*} The value of the option or null.
       */
      'velocity/getOption': function (name) {
        check(name, String);

        var option = VelocityOptions.findOne({name: name});
        return option ? option.value : null;
      },

      /**
       * Exposes the VELOCITY flag
       *
       * @method velocity/isEnabled
       */
      'velocity/isEnabled': function () {
        if (Meteor.isServer) {
          if (process.env.VELOCITY === undefined) {
            return true;
          } else {
            return !!parseInt(process.env.VELOCITY);
          }
        } else {
          return false;
        }
      }
    });
})();
