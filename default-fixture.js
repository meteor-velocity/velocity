/*jshint -W117, -W030 */

(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////
// Meteor Methods
//

  Meteor.methods({

    /**
     * Meteor method: velocityResetDatabase
     * This truncate all collections in the app by using the native mongo object and calling collection.remove()
     *
     * @method velocityResetDatabase
     */
    velocityResetDatabase: function () {

      // safety check
      if (!process.env.IS_MIRROR) {
        console.err('[velocity] velocityReset is not allowed outside of a mirror. Something has gone wrong. Contact the Velocity team.');
        return false;
      }

      var db = VelocityLogs.find()._mongo.db;
      db.collections(function (err, cols) {
        var appCollections = _.reject(cols, function (col) {
          return col.collectionName.indexOf('velocity') === 0 || col.collectionName === 'system.indexes';
        });
        _.each(appCollections, function (appCollection) {
          appCollection.remove(function () {});
        });
      });
    } // end velocityResetDatabase

  });

})();
