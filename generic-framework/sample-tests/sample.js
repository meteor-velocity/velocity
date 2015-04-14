(function () {

  'use strict';

  if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.setTimeout(function() {
      Meteor.call('fakeTestRun', {
        result: 'passed',
        type: 'Server'
      });
    }, 1000);
  });
}

if (Meteor.isClient) {
  Meteor.startup(function () {
    Meteor.setTimeout(function() {
      Meteor.call('fakeTestRun', {
        result: 'passed',
        type: 'Client'
      });
    }, 1000);
  });
}


})();
