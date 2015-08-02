/**
 * Set an option.
 *
 * @method velocity/setOption
 * @for Meteor.methods
 * @param {String} name The name of the option.
 * @param {*} value The value of the option.
 */
Velocity.methods['velocity/setOption'] = function (name, value) {
  check(name, String);
  check(value, Match.Any);

  VelocityOptions.upsert(
    {name: name},
    {$set: {name: name, value: value}}
  );
};
