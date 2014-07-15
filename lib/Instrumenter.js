"use strict";

// file loader

var PWD = process.env.PWD,
    DEBUG = process.env.DEBUG,
    fs = Npm.require('fs.extra'),
    path = Npm.require('path'),
    _ = Npm.require('lodash'),
    glob = Npm.require('glob'),
    makeDir = Meteor._wrapAsync(fs.mkdirRecursive),
    instrumenters = {istanbul: Npm.require('istanbul'), ibrik: Npm.require('ibrik')};


/**
 *
 * Takes all the js and coffee files in the meteor directory and instruments them into the mirror
 *
 * Excluded directories: private, public, programs, packages, tests
 *
 * @method instrumentFiles
 */
function instrumentFiles () {
  var then = Date.now(),
      files = _.union(getJsFiles(), getCoffeeFiles());

  _.each(files, instrumentFile);
  DEBUG && console.log('[velocity] Instrumenting', files.length, ' file(s) took', Date.now() - then, 'ms');
}

/**
 * Returns list of javascript filenames in Meteor app.
 *
 * Excluded directories: private, public, programs, packages, tests
 *
 * @method getJsFiles
 * @return {Array.<String>} list of filenames
 */
function getJsFiles () {
  var files = glob.sync('**/*.js', { cwd: PWD });
  return filterFiles(files);
}

/**
 * Returns list of coffeescript files in Meteor app.
 *
 * Excluded directories: private, public, programs, packages, tests
 *
 * @method getCoffeeFiles
 * @return {Array.<String>} list of filenames
 */
function getCoffeeFiles () {
  var files = glob.sync('**/*.coffee', { cwd: PWD });
  return filterFiles(files);
}

/**
 * Filters out any files in the following directories:
 *   private,
 *   public,
 *   programs,
 *   packages,
 *   tests
 *
 * @method filterFiles
 * @param {Array} files array of filenames to filter
 * @return {Array} filenames
 */
function filterFiles (files) {
  return _.filter(files, function (filepath) {
    var ignore = filepath.indexOf('tests') === 0 ||
      filepath.indexOf('private') === 0 ||
      filepath.indexOf('public') === 0 ||
      filepath.indexOf('programs') === 0 ||
      filepath.indexOf('packages') === 0;
    return !ignore;
  });
}

/**
 * Instruemnts a single js / coffee file, instruments it and copies it into the mirror overwriting
 * any files that exist there with the same name.
 *
 * @method instrumentFile
 * @param {String} target file path to load, relative to meteor app
 */
function instrumentFile (target) {
  var pwd = process.env.PWD,
      filename = path.join(pwd, target),
      ext = path.extname(filename),
      instrumenterLiteral = '.js' === ext ? 'istanbul' : '.coffee' === ext ? 'ibrik' : '',
      instrumenter = new instrumenters[instrumenterLiteral].Instrumenter();

  if (fs.existsSync(filename)) {

    var content = fs.readFileSync(filename).toString(),
        mirrorRelativeDir = path.join(Velocity.getMirrorPath(), path.relative(process.env.PWD, path.dirname(filename)));

    // this is not really needed but it can't hurt in case we disable copying js/coffee files in rsync
    makeDir(mirrorRelativeDir);

    DEBUG && console.log('[velocity] Instrumenting source file:', filename);

    var instrumentedCode = instrumenter.instrumentSync(content, filename);

    var targetFile = path.join(mirrorRelativeDir, path.basename(filename));
    DEBUG && console.log('[velocity] Writing instrumented file to', targetFile);
    fs.writeFileSync(targetFile, instrumentedCode);

  }
}

Velocity.instrumentFiles = instrumentFiles;
