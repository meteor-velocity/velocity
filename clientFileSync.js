Meteor.startup(function () {
  Meteor.call('velocity/isMirror', function (e, isMirror) {
    if (!isMirror) {
      Meteor.call('velocity/syncMirror', function (e, r) {
        if (e) {
          console.log('[velocity] error syncing mirror');
        }
      });
    }
  });
});
