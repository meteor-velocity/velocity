/*jshint -W117 */
/* global
 VelocityTestFiles: true,
 VelocityFixtureFiles: true,
 VelocityTestReports: true,
 VelocityAggregateReports: true,
 VelocityLogs: true,
 VelocityMirrors: true
 */

VelocityTestFiles = new Mongo.Collection('velocityTestFiles');
VelocityFixtureFiles = new Mongo.Collection('velocityFixtureFiles');
VelocityTestReports = new Mongo.Collection('velocityTestReports');
VelocityAggregateReports = new Mongo.Collection('velocityAggregateReports');
VelocityLogs = new Mongo.Collection('velocityLogs');
VelocityMirrors = new Mongo.Collection('velocityMirrors');
(function () {
  'use strict';

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
    Meteor.publish('VelocityMirrors', function () {
      return VelocityMirrors.find({});
    });
  }

  if (Meteor.isClient) {
    Meteor.subscribe('VelocityTestFiles');
    Meteor.subscribe('VelocityFixtureFiles');
    Meteor.subscribe('VelocityTestReports');
    Meteor.subscribe('VelocityAggregateReports');
    Meteor.subscribe('VelocityLogs');
    Meteor.subscribe('VelocityMirrors');
  }
})();

