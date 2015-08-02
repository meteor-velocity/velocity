/**
 * Clear all test reports, aggregate reports, and logs.
 *
 * @method velocity/reset
 * @for Velocity.Methods
 */
Velocity.Methods['velocity/reset'] = function (name) {
  check(name, String);
  VelocityInternals.reset(name);
};
