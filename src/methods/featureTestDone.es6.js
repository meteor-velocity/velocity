/**
 * Marks test file as DONE
 *
 * @method velocity/featureTestDone
 *
 * @param {Object} options
 *   @param {String} options.featureId id of test
 */
Velocity.methods['velocity/featureTestDone'] = function (options) {
  check(options, {
    featureId: String
  });

  Velocity.Collections.TestFiles.update({
    _id: options.featureId
  }, {
    $set: {status: 'DONE'}
  });

};
