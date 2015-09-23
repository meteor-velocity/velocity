/**
 * Stores metadata about the mirror.
 * Before a mirror implementation starts, it needs to call
 * this method to let Velocity know it is starting up.
 *
 * @method velocity/mirrors/init
 * @param {Object} options
 *   @param {String} options.framework The name of the test framework
 *                                     making the request
 *   @param {Number} options.port The port this mirror is running on
 *   @param {String} options.mongoUrl The mongo url this mirror is using
 *   @param {String} options.host The root url of this mirror without any
 *                        additional paths. Used for making DDP connections
 *   @param {String} options.rootUrl The root url of this mirror, which also
 *                           includes the path and params
 *   @param {String} options.rootUrlPath Adds this string to the end of
 *                           the root url in the Velocity.Collections.Mirrors
 *                           collection. To be used by test frameworks to
 *                           recognize when they are executing in a mirror.
 *                           eg. `/?jasmine=true`
 * @param {Object} [extra] Any additional metadata the implementing mirror
 *                         would like to store in the Velocity mirrors
 *                         collection.
 */
Velocity.Methods['velocity/mirrors/init'] = function (options, extra) {
  check(options, {
    framework: String,
    port: Number,
    mongoUrl: String,
    host: String,
    rootUrl: String,
    rootUrlPath: String,
    pid: Number
  });
  check(extra, Match.Optional(Object));

  if (extra) {
    _.extend(options, extra);
  }


  var _upsertQuery = {
    framework: options.framework,
    port: options.port
  };

  var _options = _.extend(options, {
    state: 'starting'
  });

  Velocity.Collections.Mirrors.upsert(_upsertQuery,
    _options);
};
