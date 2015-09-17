/* globals
   Velocity: true,
   VelocityInternals: true
*/

/**
 * The `Velocity` object provides a common API for test frameworks to report
 * test results.  Frameworks can also request assets, such as a copy of the
 * user's application (the 'mirror') in which tests can be safely run without
 * impacting on-going development.
 *
 * Test results and log activity are reported via
 * {{#crossLink "Meteor.methods"}}Meteor methods{{/crossLink}}.
 *
 * @class Velocity
 */
Velocity = {
  /**
   * @class Velocity.Collections
   */
  Collections: {},
  Methods: {}
};

VelocityInternals = {};
