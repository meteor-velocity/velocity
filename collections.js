/* global
 VelocityTestFiles: true,
 VelocityTestReports: true,
 VelocityAggregateReports: true,
 VelocityLogs: true
 */

VelocityTestFiles = new Meteor.Collection('velocityTestFiles');
VelocityFixtureFiles = new Meteor.Collection('velocityFixtureFiles');
VelocityTestReports = new Meteor.Collection('velocityTestReports');
VelocityAggregateReports = new Meteor.Collection('velocityAggregateReports');
VelocityLogs = new Meteor.Collection('velocityLogs');

(function () {
  'use strict';

  if (!Package.autopublish) {
    if (Meteor.isServer) {
      Meteor.publish('VelocityTestFiles', function () {
        return VelocityTestFiles.find({});
      });
      Meteor.publish('VelocityFixtureFiles', function () {
        return VelocityFixtureFiles.find({});
      });
      Meteor.publish('VelocityTestReports', function () {
        return VelocityTestReports.find({});
      });
      Meteor.publish('VelocityAggregateReports', function () {
        return VelocityAggregateReports.find({});
      });
      Meteor.publish('VelocityLogs', function () {
        return VelocityLogs.find({});
      });
    }

    if (Meteor.isClient) {
      Meteor.subscribe('VelocityTestFiles');
      Meteor.subscribe('VelocityFixtureFiles');
      Meteor.subscribe('VelocityTestReports');
      Meteor.subscribe('VelocityAggregateReports');
      Meteor.subscribe('VelocityLogs');
    }
  }
})();
