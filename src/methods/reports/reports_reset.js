/**
 * Clear test and aggregate reports, either for a specific framework or for
 * all frameworks.
 *
 * @method velocity/reports/reset
 * @param {Object} [options]
 *   @param {String} [options.framework] The name of a specific framework
 *                    to clear results for.  Ex. 'jasmine' or 'mocha'
 *   @param {Array} [options.notIn] A list of test Ids which should be kept
 *                                  (not cleared).  These Ids must match the
 *                                  ones passed to `velocity/reports/submit`.
 */
Velocity.Methods['velocity/reports/reset'] = function (options) {
  var query = {};

  options = options || {};
  check(options, {
    framework: Match.Optional(String),
    notIn: Match.Optional([String])
  });

  if (options.framework) {
    query.framework = options.framework;
    Velocity.Collections.AggregateReports.upsert({name: options.framework},
      {$set: {result: 'pending'}});
  }

  if (options.notIn) {
    query = _.assign(query, {_id: {$nin: options.notIn}});
  }

  Velocity.Collections.TestReports.remove(query);

  VelocityInternals.updateAggregateReports();
};
