/**
 * Exposes the IS_MIRROR flag.
 *
 * @method velocity/isMirror
 * @for Velocity.Methods
 * @return {Boolean} true if currently running in mirror
 */
Velocity.Methods['velocity/isMirror'] = function () {
  return !!process.env.IS_MIRROR;
};
