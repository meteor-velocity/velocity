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
 * @param {Velocity.Models.TestReport} data
 */
Velocity.Methods['velocity/reports/submit'] = function (data) {
  data.timestamp = data.timestamp || new Date();
  data._id = data._id || data.id || Random.id();
  data.id = data._id; // @deprecated
  var testReport = new Velocity.Models.TestReport(data);
  if (testReport.validateAll()) {
    testReport.save();
    VelocityInternals.updateAggregateReports();
  } else {
    testReport.throwValidationException();
  }
};
