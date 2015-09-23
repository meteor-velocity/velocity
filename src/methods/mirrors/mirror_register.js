/**
 * Lets Velocity know the mirror has started successfully
 *
 * @method velocity/mirrors/register
 * @param {Object} options
 *   @param {String} options.framework The name of the test framework
 *                                     making the request
 *   @param {String} options.host The root url of this mirror without any
 *                                additional paths. Must include port. Used
 *                                for making DDP connections
 */
Velocity.Methods['velocity/mirrors/register'] = function (options) {
  check(options, Match.ObjectIncluding({
    framework: String,
    host: String
  }));

  DEBUG && console.log('[velocity] Mirror registered. Handshaking with mirror...');

  this.unblock();

  // TODO: Should the host really include the port?
  var mirrorConnection = DDP.connect(options.host, {
    // Don't show the user connection errors when not in debug mode.
    // We will normally eventually connect to the mirror after
    // a connection error has been shown.
    _dontPrintErrors: !DEBUG
  });
  mirrorConnection.onReconnect = function () {
    DEBUG && console.log('[velocity] Connected to mirror, setting state to ready', options);
    mirrorConnection.call('velocity/parentHandshake', function(e, r) {
      DEBUG && console.log('[velocity] Parent Handshake response', e, r);
    });
    mirrorConnection.disconnect();

    var _updateQuery = {
      framework: options.framework,
      port: parseInt(options.port)
    };
    Velocity.Collections.Mirrors.update(_updateQuery, {
      $set: {
        state: 'ready',
        lastModified: Date.now()
      }
    });

  };
};
