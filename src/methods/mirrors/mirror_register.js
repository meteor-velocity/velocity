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

  DEBUG && console.log('[velocity] Mirror registered. Handshaking with mirror...', options);

  this.unblock();

  // TODO: Should the host really include the port?
  var mirrorConnection = DDP.connect(options.host, {
    onConnected: function () {
      DEBUG && console.log('[velocity] Connected to mirror, setting state to ready', options);
      mirrorConnection.call('velocity/parentHandshake', function (error, response) {
        DEBUG && console.log('[velocity] Parent Handshake response', error, response);
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
        mirrorConnection.disconnect();
      });
    }
  });
};
