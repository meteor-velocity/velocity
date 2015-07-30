/*jshint -W117 */
/* global
 VelocityTestFiles: true,
 VelocityFixtureFiles: true,
 VelocityTestReports: true,
 VelocityAggregateReports: true,
 VelocityLogs: true,
 VelocityMirrors: true,
 VelocityOptions: true
 */

/**
 * @class Collections
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
 * @property VelocityTestFiles
 * @type Mongo.Collection
 */
VelocityTestFiles = new Mongo.Collection('velocityTestFiles', collectionOptions);
/**
 * TODO: Needs description and example records
 *
 * @property VelocityFixtureFiles
 * @type Mongo.Collection
 */
VelocityFixtureFiles = new Mongo.Collection('velocityFixtureFiles', collectionOptions);
/**
 * TODO: Needs description and example records
 *
 * @property VelocityTestReports
 * @type Mongo.Collection
 */
VelocityTestReports = new Mongo.Collection('velocityTestReports', collectionOptions);
/**
 * TODO: Needs description and example records
 *
 * @property VelocityAggregateReports
 * @type Mongo.Collection
 */
VelocityAggregateReports = new Mongo.Collection('velocityAggregateReports', collectionOptions);
/**
 * TODO: Needs description and example records
 *
 * @property VelocityLogs
 * @type Mongo.Collection
 */
VelocityLogs = new Mongo.Collection('velocityLogs', collectionOptions);
/**
 * TODO: Needs description and example records
 *
 * @property VelocityMirrors
 * @type Mongo.Collection
 */
VelocityMirrors = new Mongo.Collection('velocityMirrors', collectionOptions);
/**
 * TODO: Needs description and example records
 *
 * @property VelocityOptions
 * @type Mongo.Collection
 */
VelocityOptions = new Mongo.Collection('velocityOptions', collectionOptions);


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
