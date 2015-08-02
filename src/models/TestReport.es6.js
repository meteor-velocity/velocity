/* globals VelocityTestReports: true */

/**
 * @property TestReports
 * @for Velocity.Collections
 * @type Mongo.Collection
 * @description The collection for test results.
 *   Contains documents of type {{#crossLink "Velocity.Models.TestReport"}}{{/crossLink}}.
 */
Velocity.Collections.TestReports = VelocityInternals.createCollection('velocityTestReports');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.TestReports`
 */
VelocityTestReports = Velocity.Collections.TestReports;


/**
 * @class Velocity.Models.TestReport
 */
Velocity.Models.TestReport = Astro.createClass({
  name: 'TestReport',
  collection: Velocity.Collections.TestReports,
  fields: {
    /**
     * @attribute name
     * @type String
     * @description Name of the test.
     */
    name: {
      type: 'string',
      validators: [
        Validators.required(),
        Validators.string()
      ]
    },
    /**
     * @attribute framework
     * @type String
     * @description Name of a testing framework. For example, 'jasmine' or 'mocha'.
     */
    framework: {
      type: 'string',
      validators: [
        Validators.required(),
        Validators.string()
      ]
    },
    /**
     * @attribute result
     * @type String
     * @description The results of the test. Can be 'passed', 'failed' or 'pending'.
     */
    result: {
      type: 'string',
      validators: [
        Validators.required(),
        Validators.choice(['passed', 'failed', 'pending'])
      ]
    },
    /**
     * @attribute id
     * @type String
     * @description The id of the test result.
     * @deprecated Use `_id` instead.
     */
    id: {
      type: 'string',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.string()
        ])
      ]
    },
    /**
     * @attribute ancestors
     * @type Array
     * @description If your test results are nested you can set the ancestors from top to bottom here.
     *              For example `['Root', 'Parent1']`.
     */
    ancestors: {
      type: 'array',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.array()
        ])
      ]
    },
    'ancestors.$': {
      type: 'string',
      validators: [
        Validators.string()
      ]
    },
    /**
     * @attribute timestamp
     * @type Date
     * @description The start time of the test.
     */
    timestamp: {
      type: 'date',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.date()
        ])
      ]
    },
    /**
     * @attribute duration
     * @type Number
     * @description The duration of your test in milliseconds.
     */
    duration: {
      type: 'number',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.number()
        ])
      ]
    },
    /**
     * @attribute browser
     * @type String
     * @description The browser that your test run in.
     */
    browser: {
      type: 'string',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.string()
        ])
      ]
    },
    /**
     * @attribute failureType
     * @type String
     * @description The type of failure.
     */
    failureType: {
      type: 'string',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.string()
        ])
      ]
    },
    /**
     * @attribute failureMessage
     * @type String
     * @description The failure message.
     */
    failureMessage: {
      type: 'string',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.string()
        ])
      ]
    },
    /**
     * @attribute failureStackTrace
     * @type String
     * @description The stack trace of the failure.
     */
    failureStackTrace: {
      type: 'string',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.string()
        ])
      ]
    }
  }
});
