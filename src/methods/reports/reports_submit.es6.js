//////////////////////////////////////////////////////////////////////
// Reports
//

/**
 * Record the results of an individual test run; a simple collector of
 * test data.
 *
 * The `data` object is stored in its entirety; any field may be passed in.
 * The optional fields documented here are suggestions based on what the
 * standard html-reporter supports.  Whether or not a field is actually
 * used is up to the specific test reporter that the user has installed.
 *
 * @method velocity/reports/submit
 * @param {Object} data
 *   @param {String} data.name Name of the test that was executed.
 *   @param {String} data.framework Name of a testing framework.
 *                                  For example, 'jasmine' or 'mocha'.
 *   @param {String} data.result The results of the test.  Standard values
 *                               are 'passed' and 'failed'.  Different test
 *                               reporters can support other values.  For
 *                               example, the aggregate tests collection uses
 *                               'pending' to indicate that results are still
 *                               coming in.
 *   @param {String} [data.id] Used to update a specific test result.  If not
 *                             provided, frameworks can use the
 *                             `velocity/reports/reset` Meteor method to
 *                             clear all tests.
 *   @param {Array} [data.ancestors] The hierarchy of suites and blocks above
 *                                   this test. For example,
 *                                ['Template', 'leaderboard', 'selected_name']
 *   @param {Date} [data.timestamp] The time that the test started for this
 *                                  result.
 *   @param {Number} [data.duration] The test duration in milliseconds.
 *   @param {String} [data.browser] Which browser did the test run in?
 *   @param {String} [data.failureType] For example, 'expect' or 'assert'
 *   @param {String} [data.failureMessage]
 *   @param {String} [data.failureStackTrace] The stack trace associated with
 *                                            the failure
 */
Velocity.Methods['velocity/reports/submit'] = function (data) {
  check(data, Match.ObjectIncluding({
    name: String,
    framework: String,
    result: String,
    id: Match.Optional(String),
    ancestors: Match.Optional([String]),
    timestamp: Match.Optional(Match.OneOf(Date, String)),
    duration: Match.Optional(Number),
    browser: Match.Optional(String),
    failureType: Match.Optional(Match.Any),
    failureMessage: Match.Optional(String),
    failureStackTrace: Match.Optional(Match.Any)
  }));

  data.timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
  data.id = data.id || Random.id();

  Velocity.Collections.TestReports.upsert(data.id, {$set: data});

  VelocityInternals.updateAggregateReports();
};
