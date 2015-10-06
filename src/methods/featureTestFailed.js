/**
 * Marks test file as TODO
 *
 * @method velocity/featureTestFailed
 *
 * @param {Object} options
 *   @param {String} options.featureId id of test
 */
Velocity.Methods['velocity/featureTestFailed'] = function (options) {
  check(options, {
    featureId: String
  });

  Velocity.Collections.TestFiles.update({
    _id: options.featureId
  }, {
    $set: {
      status: 'TODO',
      brokenPreviously: true
    }
  });
};
