/*jshint -W117 */

(function () {
  'use strict';

//////////////////////////////////////////////////////////////////////
// Public Methods
//

    /**
     * Mirrors can share the same codebase as the main process.
     * This method will run provided code inside a mirror only.
     *
     * where: client / server
     *
     * @method onTest
     * @param {Function} code
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
       *
       * @method velocity/setOption
       * @param {String} name The name of the option.
       * @param {*} value The value of the option.
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
       *
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
       * Get an option
       *
       * @method velocity/getOption
       * @param {String} name The name of the option.
       * @return {*} The value of the option or null.
       */
      'velocity/getOption': function (name) {
        check(name, String);

        var option = VelocityOptions.findOne({name: name});
        return option ? option.value : null;
      },
    });


    if (Meteor.isServer) {
      /**
       * @method setOption
       * @see velocity/setOption
       */
      Velocity.setOption = function (name, value) {
        Meteor.call('velocity/setOption', name, value);
      };

      /**
       * @method setOptions
       * @see velocity/setOptions
       */
      Velocity.setOptions = function (options) {
        Meteor.call('velocity/setOptions', options);
      };

      /**
       * @method getOption
       * @see velocity/getOption
       */
      Velocity.getOption = function (name) {
        Meteor.call('velocity/getOption', name);
      };

      Meteor.methods({
        /**
         * Exposes the VELOCITY environment variable.
         *
         * @method velocity/isEnabled
         * @return {Boolean} true if VELOCITY environment variable is truthy
         */
        'velocity/isEnabled': function () {
          if (process.env.VELOCITY === undefined) {
            return true;
          } else {
            return !!parseInt(process.env.VELOCITY);
          }
        }
      });
    }

})();
