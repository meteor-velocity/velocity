/**
 * Exposes the VELOCITY environment variable.
 *
 * @method velocity/isEnabled
 * @for Meteor.methods
 * @return {Boolean} true if VELOCITY environment variable is truthy.
 *                   false if VELOCITY environment variable is falsy.
 *                   Default: true
 */
Velocity.Methods['velocity/isEnabled'] = function () {
  return VelocityInternals.isEnvironmentVariableTrue(process.env.VELOCITY);
};
