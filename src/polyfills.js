'use strict';

// PhantomJS 1.x does not support Function.bind.
// This is a very commonly used function and
// the resulting errors are very hard to debug right now.
// For this reason we include it in velocity:core.
if (!Function.prototype.bind) {
  Function.prototype.bind = function(otherThis) {
    return _.bind(this, otherThis);
  };
}
