/*jshint -W117 */

(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////
  // Meteor Methods
  //
  Meteor.methods({

    /**
     * Meteor method: velocityGetServerCoverageObject
     * Returns the coverage object from Istanbul instrumented code for server run code.
     * This method also sets updates the date on a singleton collection which the counterpart
     * client-fixture observes, and posts back its results
     *
     * @method velocityGetServerCoverageObject
     * @return an Istanbul coverage object
     */
    velocityGetServerCoverageObject: function () {


      //  VelocityCoverageMessages
      //  VelocityClientCoverage

      // TODO
      VelocityCoverageMessages.upsert('postBack', {$set: { touchTime: Date.now() }});
      // create a future that waits on the clients coverage postback

//      var f = new Future();
//      var retry = new Retry({
//        baseTimeout: 100,
//        maxTimeout: 1000
//      });
//      var tries = 0;
//      var checkClientCoverage = function () {
//        try {
//
//
//          // if clientCoverage collection doesn't have a coverage object, retry
//          if (VelocityClientCoverage.find().fetch().length === 0) {
//            retry.retryLater(++tries, checkClientCoverage);
//          }
//
//          preResponseCallback && preResponseCallback(res.statusCode);
//          f.return(_.extend({
//            statusCode: res.statusCode
//          }, futureResponse));
//        } catch (ex) {
//          if (tries < retries ? retries : 5) {
//            DEBUG && console.log('[velocity] retrying mirror at ', url, ex.message);
//            retry.retryLater(++tries, doGet);
//          } else {
//            console.error('[velocity] mirror failed to respond', ex.message);
//            f.throw(ex);
//          }
//        }
//      };
//      doGet();
//      return f.wait();


      return {
        server: GLOBAL.__coverage__,
        client: null
      };
    } // end velocityGetServerCoverageObject


  });

})();
