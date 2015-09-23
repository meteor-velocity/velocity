/**
 * Clear log entries, either for a specific framework or for
 * all frameworks.
 *
 * @method velocity/logs/reset
 * @param {Object} [options]
 *   @param {String} [options.framework] The name of a specific framework
 *                                       to clear logs for.  Ex. 'mocha'
 */
Velocity.Methods['velocity/logs/reset'] = function (options) {
  options = options || {};
  check(options, {
    framework: Match.Optional(String)
  });

  var query = {};
  if (options.framework) {
    query.framework = options.framework;
  }
  Velocity.Collections.Logs.remove(query);
};
