/* globals VelocityInternals: true */

'use strict';

var files = VelocityMeteorInternals.files;

VelocityInternals.isWindows = function () {
  return process.platform === 'win32';
};

VelocityInternals.isDirectory = function (path) {
  var stat = files.statOrNull(path);
  return stat && stat.isDirectory();
};
