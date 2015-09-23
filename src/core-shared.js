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
      return Meteor.call('velocity/getOption', name);
    };
  }

})();
