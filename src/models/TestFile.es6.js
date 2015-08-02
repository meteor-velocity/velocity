/* globals VelocityTestFiles: true */

/**
 * TODO: Needs description and example records
 *
 * @property TestFiles
 * @for Velocity.Collections
 * @type Mongo.Collection
 */
Velocity.Collections.TestFiles = VelocityInternals.createCollection('velocityTestFiles');
/**
 * @type Mongo.Collection
 * @deprecated Use `Velocity.Collections.TestFiles`
 */
VelocityTestFiles = Velocity.Collections.TestFiles;


/**
 * @class Velocity.Models.TestFile
 */
Velocity.Models.TestFile = Astro.createClass({
  name: 'TestFile',
  collection: Velocity.Collections.TestFiles,
  fields: {
    /**
     * @attribute _id
     * @type String
     * @description The id of the test. It is the normalized absolute path to test file.
     */

    /**
     * @attribute name
     * @type String
     * @description File name.
     */
    name: {
      type: 'string',
      validators: [
        Validators.required(),
        Validators.string()
      ]
    },
    /**
     * @attribute absolutePath
     * @type String
     * @description Normalized absolute path to test file.
     */
    absolutePath: {
      type: 'string',
      validators: [
        Validators.required(),
        Validators.string()
      ]
    },
    /**
     * @attribute relativePath
     * @type String
     * @description Normalized path to test file, relative to the app directory.
     */
    relativePath: {
      type: 'string',
      validators: [
        Validators.required(),
        Validators.string()
      ]
    },
    /**
     * @attribute targetFramework
     * @type String
     * @description Name of a target testing framework.
     */
    targetFramework: {
      type: 'string',
      validators: [
        Validators.required(),
        Validators.string()
      ]
    },
    /**
     * @attribute lastModified
     * @type Date
     * @description The time of when the file was last modified.
     */
    lastModified: {
      type: 'date',
      validators: [
        Validators.required(),
        Validators.date()
      ]
    },
    /**
     * @attribute status
     * @type String
     * @description The status of the test. Can be null, 'DONE' or 'TODO'.
     *   This is currently only used for the parallel test execution implementation for Cucumber.
     */
    status: {
      type: 'string',
      validators: [
        Validators.choice([null, 'DONE', 'TODO'])
      ]
    },
    /**
     * @attribute brokenPreviously
     * @type String
     * @description Indicator if the test execution for the file broke previously.
     *   This is currently only used for the parallel test execution implementation for Cucumber.
     */
    brokenPreviously: {
      type: 'boolean',
      validators: [
        Validators.or([
          Validators.null(),
          Validators.boolean()
        ])
      ]
    }
  }
});
