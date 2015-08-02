/* global
 VelocityTestFiles: true,
 VelocityFixtureFiles: true,
 VelocityTestReports: true,
 VelocityAggregateReports: true,
 VelocityLogs: true,
 VelocityMirrors: true,
 VelocityOptions: true
 */

var collectionOptions = {};

if (Meteor.isServer) {
  var velocityMongoUrl = process.env.VELOCITY_MONGO_URL;
  if (velocityMongoUrl) {
    collectionOptions._driver = new MongoInternals.RemoteCollectionDriver(velocityMongoUrl);
  }
}

/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.TestFiles
 * @type Mongo.Collection
 */
Velocity.Collections.TestFiles = new Mongo.Collection('velocityTestFiles', collectionOptions);
/**
 * @property VelocityTestFiles
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
Velocity.Collections.FixtureFiles = new Mongo.Collection('velocityFixtureFiles', collectionOptions);
/**
 * @property VelocityFixtureFiles
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.FixtureFiles`
 */
VelocityFixtureFiles = Velocity.Collections.FixtureFiles;


/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.TestReports
 * @type Mongo.Collection
 */
Velocity.Collections.TestReports = new Mongo.Collection('velocityTestReports', collectionOptions);
/**
 * @property VelocityTestReports
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.TestReports`
 */
VelocityTestReports = Velocity.Collections.TestReports;


/**
 * TODO: Needs description and example records
 *
 * @property Velocity.Collections.AggregateReports
 * @type Mongo.Collection
 */
Velocity.Collections.AggregateReports = new Mongo.Collection('velocityAggregateReports', collectionOptions);
/**
 * TODO: Needs description and example records
 *
 * @property VelocityAggregateReports
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
Velocity.Collections.Logs = new Mongo.Collection('velocityLogs', collectionOptions);
/**
 * @property VelocityLogs
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
Velocity.Collections.Mirrors = new Mongo.Collection('velocityMirrors', collectionOptions);
/**
 * @property VelocityMirrors
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
Velocity.Collections.Options = new Mongo.Collection('velocityOptions', collectionOptions);
/**
 * @property VelocityOptions
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
