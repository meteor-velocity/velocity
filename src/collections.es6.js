/* globals
 VelocityTestFiles: true,
 VelocityFixtureFiles: true,
 VelocityAggregateReports: true,
 VelocityLogs: true,
 VelocityMirrors: true,
 VelocityOptions: true
 */

/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.TestFiles
 * @type Mongo.Collection
 */
Velocity.Collections.TestFiles = VelocityInternals.createCollection('velocityTestFiles');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.TestFiles`
 */
VelocityTestFiles = Velocity.Collections.TestFiles;


/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.FixtureFiles
 * @type Mongo.Collection
 */
Velocity.Collections.FixtureFiles = VelocityInternals.createCollection('velocityFixtureFiles');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.FixtureFiles`
 */
VelocityFixtureFiles = Velocity.Collections.FixtureFiles;


/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.AggregateReports
 * @type Mongo.Collection
 */
Velocity.Collections.AggregateReports = VelocityInternals.createCollection('velocityAggregateReports');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.AggregateReports`
 */
VelocityAggregateReports = Velocity.Collections.AggregateReports;


/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.Logs
 * @type Mongo.Collection
 */
Velocity.Collections.Logs = VelocityInternals.createCollection('velocityLogs');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.Logs`
 */
VelocityLogs = Velocity.Collections.Logs;


/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.Mirrors
 * @type Mongo.Collection
 */
Velocity.Collections.Mirrors = VelocityInternals.createCollection('velocityMirrors');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.Mirrors`
 */
VelocityMirrors = Velocity.Collections.Mirrors;


/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.Options
 * @type Mongo.Collection
 */
Velocity.Collections.Options = VelocityInternals.createCollection('velocityOptions');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.Options`
 */
VelocityOptions = Velocity.Collections.Options;


(function () {
  'use strict';

  if (Meteor.isServer) {
    Meteor.publish('VelocityTestFiles', function () {
      return Velocity.Collections.TestFiles.find({});
    });
    Meteor.publish('VelocityFixtureFiles', function () {
      return Velocity.Collections.FixtureFiles.find({});
    });
    Meteor.publish('VelocityTestReports', function () {
      return Velocity.Collections.TestReports.find({});
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
    Meteor.publish('VelocityOptions', function () {
      return VelocityOptions.find({});
    });
  }

  if (Meteor.isClient) {
    Meteor.subscribe('VelocityTestFiles');
    Meteor.subscribe('VelocityFixtureFiles');
    Meteor.subscribe('VelocityTestReports');
    Meteor.subscribe('VelocityAggregateReports');
    Meteor.subscribe('VelocityLogs');
    Meteor.subscribe('VelocityMirrors');
    Meteor.subscribe('VelocityOptions');
  }
})();
