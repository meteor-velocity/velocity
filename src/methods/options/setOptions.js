/**
 * Set multiple options.
 *
 * @method velocity/setOptions
 * @param options Hash with options (name: value).
 */
Velocity.Methods['velocity/setOptions'] = function (options) {
  check(options, Object);

  for (var name in options) {
    if (options.hasOwnProperty(name)) {
      Meteor.call('velocity/setOption', name, options[name]);
    }
  }
};
