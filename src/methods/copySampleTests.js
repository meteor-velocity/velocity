var files = VelocityMeteorInternals.files;
var fs = Npm.require('fs-extra');
var mkdirp = Meteor.wrapAsync(fs.mkdirp, fs);

/**
 * Copy sample tests from frameworks `sample-tests` directories
 * to the user's application's `tests` directory.
 *
 * @method velocity/copySampleTests
 *
 * @param {Object} options
 *   @param {String} options.framework Framework name. Ex. 'jasmine', 'mocha'
 */
Velocity.Methods['velocity/copySampleTests'] = function (options) {
  var sampleTestGenerator,
    sampleTests;

  options = options || {};
  check(options, {
    framework: String
  });

  this.unblock();

  sampleTestGenerator = VelocityInternals.frameworkConfigs[options.framework].sampleTestGenerator;
  if (sampleTestGenerator) {
    sampleTests = sampleTestGenerator(options);

    DEBUG && console.log('[velocity] found ', sampleTests.length,
      'sample test files for', options.framework);

    sampleTests.forEach(function (testFile) {
      var fullTestPath = files.pathJoin(Velocity.getTestsPath(), testFile.path),
        testDir = files.pathDirname(fullTestPath);

      mkdirp(files.convertToOSPath(testDir));
      files.writeFile(fullTestPath, testFile.contents);
    });
  }
};
