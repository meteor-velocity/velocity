/**
 * This is the best indicator of the mirror's ready status, so it's used
 * to inform the user when there may be delays
 *
 * @method velocity/parentHandshake
 * @for Velocity.Methods
 */
Velocity.Methods['velocity/parentHandshake'] = function () {
  console.log('[velocity] Established connection with Velocity.');
};
