/**
 * Frameworks must call this method to inform Velocity they have completed
 * their current test runs. Velocity uses this flag when running in CI mode.
 *
 * @method velocity/reports/completed
 * @param {Object} data
 *   @param {String} data.framework Name of a test framework.  Ex. 'jasmine'
 */
Velocity.Methods['velocity/reports/completed'] = function (data) {
  check(data, {
    framework: String
  });

  Velocity.Collections.AggregateReports.upsert({'name': data.framework},
    {$set: {'result': 'completed'}});
  VelocityInternals.updateAggregateReports();
};
