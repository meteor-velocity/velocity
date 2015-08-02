/**
 * Log a message to the Velocity log store.  This provides a central
 * location for different reporters to query for test framework log
 * entries.
 *
 * @method velocity/logs/submit
 * @param {Object} options
 *   @param {String} options.framework The name of the test framework
 *   @param {String} options.message The message to log
 *   @param {String} [options.level] Log level.  Ex. 'error'. Default: 'info'
 *   @param {Date} [options.timestamp]
 */
Velocity.Methods['velocity/logs/submit'] = function (options) {
  check(options, {
    framework: String,
    message: String,
    level: Match.Optional(String),
    timestamp: Match.Optional(Match.OneOf(Date, String))
  });

  Velocity.Collections.Logs.insert({
    framework: options.framework,
    message: options.message,
    level: options.level || 'info',
    timestamp: options.timestamp ? new Date(options.timestamp) : new Date()
  });
};
