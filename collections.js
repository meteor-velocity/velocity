/*jshint -W117 */
/* global
 VelocityTestFiles: true,
 VelocityTestReports: true,
 VelocityAggregateReports: true,
 VelocityLogs: true
 */

VelocityTestFiles = new Meteor.Collection('velocityTestFiles');
VelocityTestReports = new Meteor.Collection('velocityTestReports');
VelocityAggregateReports = new Meteor.Collection('velocityAggregateReports');
VelocityLogs = new Meteor.Collection('velocityLogs');
VelocityMirrors = new Meteor.Collection('velocityMirrors');
(function () {
  'use strict';

  if (Meteor.isServer) {
    Meteor.publish('VelocityTestFiles', function () {
      return VelocityTestFiles.find({});
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
    Meteor.subscribe('VelocityTestReports');
    Meteor.subscribe('VelocityAggregateReports');
    Meteor.subscribe('VelocityLogs');
    Meteor.subscribe('VelocityMirrors');
  }
})();

