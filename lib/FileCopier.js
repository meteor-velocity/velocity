'use strict';

var _ = Npm.require('lodash');
var path = Npm.require('path');
var fs = Npm.require('fs-extra');
var removeFile = Meteor.wrapAsync(fs.remove);
var copyFile = Meteor.wrapAsync(fs.copy);

/**
 * Worker that copies test files to the mirror reactively.
 *
 * @class FileCopier
 * @constructor
 * @param {object} options
 * @param {string} options.targetFramework The name of the target framework
 *                                         for which the tests should be copied
 *                                         to the mirror.
 * @param {function} [options.onFileAdded] Callback that is called after a
 *                                         file was added.
 * @param {function} [options.onFileChanged] Callback that is called after a
 *                                           file has changed.
 * @param {function} [options.onFileRemoved] Callback that is called after a
 *                                           file was removed.
 * @param {function} [options.shouldCopy] Control whether a file is copied.
 *                                        Passed the file object from the
 *                                        VelocityTestFiles collection which
 *                                        has a `absolutePath` field.
 *                                        Default: true
 * @param {function} [options.convertTestPathToMirrorPath] A function that converts the
 *                                                         test file path to the mirror path.
 *
 * @example
 *     var fileCopier = new Velocity.FileCopier({
 *       targetFramework: TEST_FRAMEWORK_NAME
 *     });
 *     fileCopier.start();
 */
Velocity.FileCopier = function VelocityFileCopier(options) {
  check(options, {
    targetFramework: String,
    onFileAdded: Match.Optional(Function),
    onFileChanged: Match.Optional(Function),
    onFileRemoved: Match.Optional(Function),
    shouldCopy: Match.Optional(Function),
    convertTestPathToMirrorPath: Match.Optional(Function)
  });
  this.options = _.extend({
    onFileAdded: _.noop,
    onFileChanged: _.noop,
    onFileRemoved: _.noop,
    shouldCopy: function () { return true; },
    convertTestPathToMirrorPath: this._defaultConvertTestPathToMirrorPath
  }, options);
};

_.extend(Velocity.FileCopier.prototype, {

  /**
   * Starts copying files to the mirror.
   *
   * @method start
   * @memberof Velocity.FileCopier.prototype
   */
  start: function () {
    if (!this._observer) {
      var testFilesCursor = VelocityTestFiles.find({
        targetFramework: this.options.targetFramework
      });

      // Copy all tests again after rsync
      Velocity.addPreProcessor(function () {
        testFilesCursor.forEach(this._onFileAdded.bind(this));
      }.bind(this));

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

  _onFileAdded: function (newFile) {
    if (this.options.shouldCopy(newFile)) {
      this._replaceFileInMirror(newFile);
      this.options.onFileAdded(newFile);
    }
  },

  _onFileChanged: function (newFile, oldFile) {
    if (this.options.shouldCopy(oldFile)) {
      // Remove the oldFile in case the absolutePath has changed
      this._removeFileFromMirror(oldFile);
    }
    if (this.options.shouldCopy(newFile)) {
      this._replaceFileInMirror(newFile);
      this.options.onFileAdded(oldFile, newFile);
    }
  },

  _onFileRemoved: function (removedFile) {
    this._removeFileFromMirror(removedFile);
    this.options.onFileRemoved(removedFile);
  },

  _removeFileFromMirror: function (file) {
    var mirrorFilePath = this._convertTestPathToMirrorPath(file.absolutePath);
    DEBUG && console.log('[Velocity.FileCopier] Remove file from mirror', mirrorFilePath);
    removeFile(mirrorFilePath);
  },

  _replaceFileInMirror: function (file) {
    var self = this;

    var mirrorFilePath = self._convertTestPathToMirrorPath(file.absolutePath);
    DEBUG && console.log('[Velocity.FileCopier] Replace file in mirror', mirrorFilePath);
    copyFile(file.absolutePath, mirrorFilePath);
  },

  _isInTestsPath: function _isInTestsPath(filePath) {
    var testsPath = Velocity.getTestsPath();
    return filePath.substr(0, testsPath.length) === testsPath;
  },

  _convertTestPathToMirrorPath: function (filePath) {
    if (!this._isInTestsPath(filePath)) {
      throw new Error('[Velocity.FileCopier] Path "' + filePath + '" is not in the tests path.');
    }

    filePath = filePath.substr(Velocity.getTestsPath().length);
    filePath = this.options.convertTestPathToMirrorPath.call(this, filePath);

    return Velocity.getMirrorPath() + filePath;
  },

  _defaultConvertTestPathToMirrorPath: function (filePath) {
    var targetFramework = this.options.targetFramework;
    filePath = filePath.replace(targetFramework + '/client', 'client/' + targetFramework);
    filePath = filePath.replace(targetFramework + '/server', 'server/' + targetFramework);

    return filePath
  }
});
