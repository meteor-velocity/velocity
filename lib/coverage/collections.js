/*jshint -W117 */
/* global
 VelocityCoverageMessages: true,
 VelocityClientCoverage: true,
 */

VelocityCoverageMessages = new Meteor.Collection('velocityCoverageMessages');
VelocityClientCoverage = new Meteor.Collection('velocityClientCoverage');

(function () {
  'use strict';

  if (!Package.autopublish) {
    if (Meteor.isServer) {
      Meteor.publish('velocityCoverageMessages', function () {
        return VelocityCoverageMessages.find({});
      });
      Meteor.publish('velocityClientCoverage', function () {
        return VelocityClientCoverage.find({});
      });
    }

    if (Meteor.isClient) {
      Meteor.subscribe('velocityCoverageMessages');
      Meteor.subscribe('velocityClientCoverage');
    }
  }
})();
