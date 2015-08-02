/**
 * Exposes the VELOCITY environment variable.
 *
 * @method velocity/isEnabled
 * @for Velocity.Methods
 * @return {Boolean} true if VELOCITY environment variable is truthy.
 *                   false if VELOCITY environment variable is falsy.
 *                   Default: true
 */
Velocity.Methods['velocity/isEnabled'] = function () {
  var type = typeof process.env.VELOCITY;

  switch (type) {
    case 'undefined':
      return true;
    case 'string':
      if (process.env.VELOCITY.toLowerCase() === 'false' ||
        parseInt(process.env.VELOCITY) === 0) {
        return false;
      }
      return true;
    default:
      return !!process.env.VELOCITY;
  }
};
