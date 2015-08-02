/**
 * Registers a testing framework plugin via a Meteor method.
 *
 * @method velocity/register/framework
 * @param {String} name The name of the testing framework.
 * @param {Object} [options] Options for the testing framework.
 *   @param {String} [options.regex] The regular expression for test files
 *                    that should be assigned to the testing framework.
 *                    The path relative to the tests folder is matched
 *                    against it. Default: 'name/.+\.js$' (name is
 *                    the testing framework name).
 *   @param {String} [options.disableAutoReset]   Velocity's reset cycle
 *                    will skip reports and logs for this framework.
 *                    It is up to the framework to clean up its ****!
 *   @param {Function} [options.sampleTestGenerator] sampleTestGenerator
 *                    returns an array of fileObjects with the following
 *                    fields:
 *                      path - String - relative path to place test files
 *                                      (from PROJECT/tests)
 *                      contents - String - contents to put in the test file
 *                                          at the corresponding path
 */
Velocity.Methods['velocity/register/framework'] = function (name, options) {
  options = options || {};
  check(name, String);
  check(options, {
    disableAutoReset: Match.Optional(Boolean),
    regex: Match.Optional(RegExp),
    sampleTestGenerator: Match.Optional(Function)
  });

  VelocityInternals.frameworkConfigs[name] = VelocityInternals.parseTestingFrameworkOptions(name, options);

  // make sure the appropriate aggregate records are added
  VelocityInternals.reset(name);
};
