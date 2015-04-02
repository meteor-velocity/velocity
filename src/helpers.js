/* globals VelocityInternals: true */

'use strict';

VelocityInternals.isWindows = function () {
  return process.platform === 'win32';
};
