if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.setTimeout(function() {
      Meteor.call('pretendTests', {
        result: 'passed',
        type: 'Server'
      });
    }, 1000);
  });
}

if (Meteor.isClient) {
  Meteor.startup(function () {
    Meteor.setTimeout(function() {
      Meteor.call('pretendTests', {
        result: 'passed',
        type: 'Client'
      });
    }, 1000);
  });
}
