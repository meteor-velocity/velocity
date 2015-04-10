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
   * @for Velocity
   * @param {Function} code
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
     * See <a href="Meteor.methods.html#method_velocity/setOption">velocity/setOption</a>
     *
     * @method setOption
     */
    Velocity.setOption = function (name, value) {
      Meteor.call('velocity/setOption', name, value);
    };

    /**
     * See <a href="Meteor.methods.html#method_velocity/setOptions">velocity/setOptions</a>
     *
     * @method setOptions
     */
    Velocity.setOptions = function (options) {
      Meteor.call('velocity/setOptions', options);
    };

    /**
     * See <a href="Meteor.methods.html#method_velocity/getOption">velocity/getOption</a>
     *
     * @method getOption
     * @for Velocity
     */
    Velocity.getOption = function (name) {
      Meteor.call('velocity/getOption', name);
    };
  }


  Meteor.methods({
    /**
     * Set an option.
     *
     * @method velocity/setOption
     * @for Meteor.methods
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
    Meteor.methods({
      /**
       * Exposes the VELOCITY environment variable.
       *
       * @method velocity/isEnabled
       * @for Meteor.methods
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
