/**
 * Finds a test file with TODO status
 * changes the status to 'DOING', and returns it
 *
 * @method velocity/returnTODOTestAndMarkItAsDOING
 *
 * @param {Object} options
 *   @param {String} options.framework Framework name. Ex. 'jasmine', 'mocha'
 */
Velocity.Methods['velocity/returnTODOTestAndMarkItAsDOING'] = function(options) {
  check(options, {
    framework: String
  });

  var _query = {
    targetFramework: options.framework,
    status: 'TODO'
  };

  var _update = {
    $set: {status: 'DOING'}
  };


  var collectionObj = Velocity.Collections.TestFiles.rawCollection();
  var wrappedFunc = Meteor.wrapAsync(collectionObj.findAndModify,
    collectionObj);
  var _TODOtest = wrappedFunc(_query, {}, _update, {});

  return _TODOtest;
};
