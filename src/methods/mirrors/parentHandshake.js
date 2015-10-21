/**
 * This is the best indicator of the mirror's ready status, so it's used
 * to inform the user when there may be delays
 *
 * @method velocity/parentHandshake
 * @for Meteor.methods
 */
Velocity.Methods['velocity/parentHandshake'] = function () {
  console.log('[velocity] Mirror has established connection with Velocity.');
  Velocity.triggerVelocityStartupFunctions();
};
