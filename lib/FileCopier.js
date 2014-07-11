/* global
 Velocity: false,
 DEBUG: false,
 check: false
 */

'use strict';

var _ = Npm.require('lodash');
var path = Npm.require('path');
var fs = Npm.require('fs.extra');
var fileExists = Meteor._wrapAsync(fs.exists);
var removeFile = Meteor._wrapAsync(fs.unlink);
var copyFile = Meteor._wrapAsync(fs.copy);
var makeDir = Meteor._wrapAsync(fs.mkdirRecursive);

/**
 * Worker that copies test files to the mirror reactively.
 * @constructor
 * @param {object} options
 * @param {string} options.targetFramework The name of the target framework
 *                                         for which the tests should be copied to the mirror.
 * @example
 * var fileCopier = new Velocity.FileCopier({
 *   targetFramework: TEST_FRAMEWORK_NAME
 * });
 * fileCopier.start();
 */
Velocity.FileCopier = function VelocityFileCopier(options) {
  check(options, {
    targetFramework: String
  });
  this.options = options;
};

_.extend(Velocity.FileCopier.prototype, {

  /**
   * Starts copying files to the mirror.
   * @memberof Velocity.FileCopier.prototype
   */
  start: function () {
    if (!this._observer) {
      var testFilesCursor = VelocityTestFiles.find({
        targetFramework: this.options.targetFramework
      });

      this._observer = testFilesCursor.observe({
        added: this._onFileAdded.bind(this),
        changed: this._onFileChanged.bind(this),
        removed: this._onFileRemoved.bind(this)
      });
    }
  },

  /**
   * Stops copying files to the mirror.
   * @memberof Velocity.FileCopier.prototype
   */
  stop: function () {
    this._observer.stop();
    this._observer = null;
  },

  _onFileAdded: function _onFileAdded(newFile) {
    this._replaceFileInMirror(newFile);
  },

  _onFileChanged: function _onFileChanged(newFile, oldFile) {
    this._removeFileFromMirror(oldFile);
    this._replaceFileInMirror(newFile);
  },

  _onFileRemoved: function _onFileRemoved(removedFile) {
    this._removeFileFromMirror(removedFile);
  },

  _removeFileFromMirror: function _removeFileFromMirror(file) {
    var mirrorFilePath = this._convertTestsPathToMirrorPath(file.absolutePath);
    DEBUG && console.log('[Velocity.FileCopier] Remove file from mirror', mirrorFilePath);
    removeFile(mirrorFilePath);
  },

  _replaceFileInMirror: function _replaceFileInMirror(file) {
    var self = this;

    var mirrorFilePath = self._convertTestsPathToMirrorPath(file.absolutePath);
    DEBUG && console.log('[Velocity.FileCopier] Replace file in mirror', mirrorFilePath);
    if (fileExists(mirrorFilePath)) {
      removeFile(mirrorFilePath);
    } else {
      makeDir(path.dirname(mirrorFilePath));
    }
    copyFile(file.absolutePath, mirrorFilePath);
  },

  _isInTestsPath: function _isInTestsPath(filePath) {
    var testsPath = getTestsPath();
    return filePath.substr(0, testsPath.length) === testsPath;
  },

  _convertTestsPathToMirrorPath: function _convertTestsPathToMirrorPath(filePath) {
    if (!this._isInTestsPath(filePath)) {
      throw new Error('[Velocity.FileCopier] Path "' + filePath + '" is not in the tests path.');
    }

    filePath = filePath.substr(getTestsPath().length);
    var targetFramework = this.options.targetFramework;
    filePath = filePath.replace(targetFramework + '/client', 'client/' + targetFramework);
    filePath = filePath.replace(targetFramework + '/server', 'server/' + targetFramework);

    return getMirrorPath() + filePath;
  }
});

// TODO: This should be in a central place in velocity
function getMirrorPath() {
  return process.env.PWD + '/.meteor/local/.mirror';
}

// TODO: This should be in a central place in velocity
function getTestsPath() {
  return process.env.PWD + '/tests';
}
