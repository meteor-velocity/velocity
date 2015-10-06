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

VelocityInternals.isEnvironmentVariableTrue = function (environmentVariable, defaultValue = true) {
  var type = typeof environmentVariable;

  switch (type) {
    case 'undefined':
      return defaultValue;
    case 'string':
      if (environmentVariable.toLowerCase() === 'false' ||
        parseInt(environmentVariable) === 0) {
        return false;
      }
      return true;
    default:
      return !!environmentVariable;
  }
};
