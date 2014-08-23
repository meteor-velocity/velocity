/*jshint -W117, -W030 */

(function () {
  'use strict';

  if (Meteor.isServer) {

//////////////////////////////////////////////////////////////////////
// Meteor Methods
//

    var Future;
    Meteor.startup(function () {
      Future = Npm.require('fibers/future');
    });

    Meteor.methods({

      /**
       * Meteor method: velocityIsMirror
       * Exposes the IS_MIRROR flag to mirror clients
       *
       * @method velocityIsMirror
       */
      velocityIsMirror: function () {
        return !!process.env.IS_MIRROR;
      },

      /**
       * Meteor method: velocityResetDatabase
       * This truncate all collections in the app by using the native mongo object and calling collection.remove()
       *
       * @method velocityResetDatabase
       */
      velocityResetDatabase: function () {

        // safety check
        if (!process.env.IS_MIRROR) {
          console.err('[velocity] velocityReset is not allowed outside of a mirror. Something has gone wrong.', Velocity.getReportGithubIssueMessage());
          return false;
        }

        var fut = new Future();

        var collectionsRemoved = 0;
        var db = VelocityLogs.find()._mongo.db;
        db.collections(function (err, collections) {

          var appCollections = _.reject(collections, function (col) {
            return col.collectionName.indexOf('velocity') === 0 || col.collectionName === 'system.indexes';
          });

          _.each(appCollections, function (appCollection) {
            appCollection.remove(function (e) {
              if (e) {
                fut.return('fail: ' + e);
              }
              collectionsRemoved++;
              if (appCollections.length === collectionsRemoved) {
                fut['return']('success');
              }
            });
          });

        });

        return fut.wait();

      } // end velocityResetDatabase

    });

  }


})();
