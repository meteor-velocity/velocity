'use strict';

describe('Velocity Methods', function () {

  //////////////////////////////////////////////////////////////////////
  // Register
  //
  describe('velocity/register/framework', function () {
    afterEach(function () {
      Velocity.unregisterTestingFramework('foo');
    });

    it('creates a pending aggregate report', function () {
      var report;

      Meteor.call('velocity/register/framework', 'foo');
      report = Velocity.Collections.AggregateReports.findOne({name: 'foo'});
      expect(report.result).toBe('pending');
    });
  });


  //////////////////////////////////////////////////////////////////////
  // Logs
  //
  describe('velocity/logs/submit', function () {
    it('stores a log entry', function () {
      var entry = {
            framework: 'logSubmitTest',
            message: 'Test message'
          },
          record;

      Meteor.call('velocity/logs/submit', entry);
      record = Velocity.Collections.Logs.findOne({framework: 'logSubmitTest'});
      expect(record.message).toBe('Test message');
    });
  });

  describe('velocity/logs/reset', function () {
    it('clears log entries', function () {
      var count = 0,
          framework = 'logResetTest';

      Meteor.call('velocity/logs/submit', {framework: framework,
                                           message: 'Test1' });
      Meteor.call('velocity/logs/submit', {framework: framework,
                                           message: 'Test2' });
      count = Velocity.Collections.Logs.find({framework: framework}).count();
      expect(count).toBe(2);

      Meteor.call('velocity/logs/reset', {framework: framework});
      count = Velocity.Collections.Logs.find({framework: framework}).count();
      expect(count).toBe(0);
    });
  });


  //////////////////////////////////////////////////////////////////////
  // Reports
  //
  describe('velocity/reports/submit', function () {
    it('stores a report entry', function () {
      var framework = 'reportSubmitTest',
          entry = {
            framework: framework,
            name: 'Test1',
            result: 'passed'
          },
          record;

      Meteor.call('velocity/reports/submit', entry);
      record = Velocity.Collections.TestReports.findOne({framework: framework});
      expect(record.name).toBe('Test1');
      expect(record.result).toBe('passed');
    });
  });

  describe('velocity/reports/completed', function () {

    /*
     * NOTE: Attempted to remove jasmine so we could test aggregate results
     *       but check of total test framework count still prevents that.
     *       Need a way to hide the jasmine test frameworks when checking
     *       aggregate.
    beforeEach(function () {
      this.jasmineReports = _removeJasmineReports();
    });

    afterEach(function () {
      this.jasmineReports.forEach(function (entry) {
        Velocity.Collections.AggregateReports.insert(entry);
      });
    });
    */

    it('marks framework aggregate report as completed', function () {
      var framework = 'reportCompletedTest',
          entry = {
            framework: framework,
            name: 'Test1',
            result: 'passed'
          },
          record;

      Meteor.call('velocity/reports/submit', entry);
      Meteor.call('velocity/reports/completed', {framework: framework});

      record = Velocity.Collections.AggregateReports.findOne({'name': framework});
      expect(record.result).toBe('completed');

      //console.log(Velocity.Collections.AggregateReports.find({}).fetch());
    });
  });

  /**
   * Removes jasmine entries from aggregate report collection.
   * For use when testing aggregate completion code.
   *
   * @method removeJasmineReports
   * @return {Array} Entries that were removed
   * @private
   */
  //function _removeJasmineReports () {
  //  var collection = Velocity.Collections.AggregateReports,
  //      query,
  //      records;
  //
  //  query = {name: "jasmine-server-integration"};
  //  records = collection.find(query).fetch();
  //  collection.remove(query);
  //
  //  query.name = "jasmine-client-integration";
  //  records = records.concat(collection.find(query).fetch());
  //  collection.remove(query);
  //
  //  return records;
  //}

  describe('velocity/reports/reset', function () {
    it('clears report entries', function () {
      var count = 0,
          framework = 'reportResetTest',
          entry = {
            framework: framework,
            name: 'Test1',
            result: 'passed'
          };

      Meteor.call('velocity/reports/submit', entry);
      entry.name = 'Test2';
      Meteor.call('velocity/reports/submit', entry);
      count = Velocity.Collections.TestReports.find({framework: framework}).count();
      expect(count).toBe(2);

      Meteor.call('velocity/reports/reset', {framework: framework});
      count = Velocity.Collections.TestReports.find({framework: framework}).count();
      expect(count).toBe(0);
    });
  });

  //////////////////////////////////////////////////////////////////////
  // Test Files
  //

  describe('velocity/returnTODOTestAndMarkItAsDOING', function() {
    it('returns TODO test while marking it as DOING', function() {
      var filesWithChangedStatus,
        filesWithOriginalStatus,
        framework = 'returnTodo',
        originalStatus = 'TODO',
        changedStatus = 'DOING';

        var entry = {
          targetFramework: framework,
          status: originalStatus
        };

      var changedEntry = JSON.parse(JSON.stringify(entry));
      changedEntry.status = changedStatus;

      filesWithOriginalStatus = Velocity.Collections.TestFiles.find(entry).count();
      expect(filesWithOriginalStatus, 0);

      Velocity.Collections.TestFiles.insert(entry);

      filesWithOriginalStatus = Velocity.Collections.TestFiles.find(entry).count();
      expect(filesWithOriginalStatus, 1);

      filesWithChangedStatus = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesWithChangedStatus).toBe(0);

      var _returnedFile = Meteor.call('velocity/returnTODOTestAndMarkItAsDOING', {framework: framework});

      expect(_returnedFile).toBeDefined();
      expect(_returnedFile.status).toBe(originalStatus);

      filesWithChangedStatus = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesWithChangedStatus).toBe(1);


      Velocity.Collections.TestFiles.remove(changedEntry);
    });
  });


  describe('velocity/featureTestDone', function() {
    it('sets feature as done', function() {
      var filesWithChangedStatus,
        filesWithOriginalStatus,
        framework = 'testDone',
        originalStatus = 'DOING',
        changedStatus = 'DONE',
        featureId = 'testDoneFeatureId';

      var entry = {
        _id: featureId,
        targetFramework: framework,
        status: originalStatus
      };

      var changedEntry = JSON.parse(JSON.stringify(entry));
      changedEntry.status = changedStatus;

      filesWithOriginalStatus = Velocity.Collections.TestFiles.find(entry).count();
      expect(filesWithOriginalStatus, 0);

      Velocity.Collections.TestFiles.insert(entry);

      filesWithOriginalStatus = Velocity.Collections.TestFiles.find(entry).count();
      expect(filesWithOriginalStatus, 1);

      filesWithChangedStatus = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesWithChangedStatus).toBe(0);

      Meteor.call('velocity/featureTestDone', {featureId: featureId});

      filesWithChangedStatus = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesWithChangedStatus).toBe(1);


      Velocity.Collections.TestFiles.remove(changedEntry);


    });
  });

  describe('velocity/featureTestFailed', function() {
    it('sets feature as TODO', function() {
      var filesWithChangedStatus,
        filesWithOriginalStatus,
        framework = 'testFailed',
        originalStatus = 'DOING',
        changedStatus = 'TODO',
        featureId = 'testFailedFeatureId';

      var entry = {
        _id: featureId,
        targetFramework: framework,
        status: originalStatus
      };

      var changedEntry = JSON.parse(JSON.stringify(entry));
      changedEntry.status = changedStatus;

      filesWithOriginalStatus = Velocity.Collections.TestFiles.find(entry).count();
      expect(filesWithOriginalStatus, 0);

      Velocity.Collections.TestFiles.insert(entry);

      filesWithOriginalStatus = Velocity.Collections.TestFiles.find(entry).count();
      expect(filesWithOriginalStatus, 1);

      filesWithChangedStatus = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesWithChangedStatus).toBe(0);

      Meteor.call('velocity/featureTestFailed', {featureId: featureId});

      filesWithChangedStatus = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesWithChangedStatus).toBe(1);

      Velocity.Collections.TestFiles.remove(changedEntry);

    });

    it('sets feature as brokenPreviously', function() {
      var filesBrokenPreviously,
        framework = 'testFailed',
        originalStatus = 'DOING',
        featureId = 'testFailedFeatureId';

      var entry = {
        _id: featureId,
        targetFramework: framework,
        status: originalStatus
      };

      var changedEntry = JSON.parse(JSON.stringify(entry));
      delete changedEntry.status;
      changedEntry.brokenPreviously = true;

      Velocity.Collections.TestFiles.insert(entry);

      filesBrokenPreviously = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesBrokenPreviously, 0);

      Meteor.call('velocity/featureTestFailed', {featureId: featureId});

      filesBrokenPreviously = Velocity.Collections.TestFiles.find(changedEntry).count();
      expect(filesBrokenPreviously).toBe(1);

      Velocity.Collections.TestFiles.remove(changedEntry);

    });


  });

  //////////////////////////////////////////////////////////////////////
  // Options
  //
  describe('velocity/setOption', function () {
    it('sets an option', function () {
      var name,
          value,
          actual;

      name = 'foo';
      value = 'bar';
      Meteor.call('velocity/setOption', name, value);
      actual = Velocity.Collections.Options.findOne({name: name});
      expect(actual.value).toEqual(value);
    });
  });

  describe('velocity/getOption', function () {
    it('gets an option', function () {
      var name,
          value,
          actual;

      name = 'foo';
      value = 'bar';
      Meteor.call('velocity/setOption', name, value);
      actual = Meteor.call('velocity/getOption', name);
      expect(actual).toEqual(value);
    });
  });

  describe('velocity/setOptions', function () {
    it('sets multiple options', function () {
      var options = {
            'foo': 'bar',
            'foo2': 'baz',
            'number': 1
          },
          actual;

      Meteor.call('velocity/setOptions', options);
      actual = Velocity.Collections.Options.findOne({name: 'foo'});
      expect(actual.value).toEqual('bar');

      actual = Velocity.Collections.Options.findOne({name: 'foo2'});
      expect(actual.value).toEqual('baz');

      actual = Velocity.Collections.Options.findOne({name: 'number'});
      expect(actual.value).toEqual(1);
    });
  });


  //////////////////////////////////////////////////////////////////////
  // isEnabled
  //
  describe('velocity/isEnabled', function () {
    beforeEach(function () {
      this.original = process.env.VELOCITY;
    });

    afterEach(function () {
      process.env.VELOCITY = this.original;
    });

    it('returns true when environment variable is not set', function () {
      var actual;

      delete process.env.VELOCITY;

      actual = Meteor.call('velocity/isEnabled');
      expect(actual).toBe(true);
    });

    it('returns false when environment variable is set to falsy', function () {
      var actual;

      process.env.VELOCITY = false;
      actual = Meteor.call('velocity/isEnabled');
      expect(actual).toBe(false);

      process.env.VELOCITY = 0;
      actual = Meteor.call('velocity/isEnabled');
      expect(actual).toBe(false);
    });

    it('returns true when environment variable is set to truthy', function () {
      var actual;

      process.env.VELOCITY = 1;
      actual = Meteor.call('velocity/isEnabled');
      expect(actual).toBe(true);

      process.env.VELOCITY = 'true';
      actual = Meteor.call('velocity/isEnabled');
      expect(actual).toBe(true);
    });
  });


  //////////////////////////////////////////////////////////////////////
  // isMirror
  //
  describe('velocity/isMirror', function () {

    beforeEach(function () {
      this.originalIsMirror = process.env.IS_MIRROR;
    });

    afterEach(function () {
      process.env.IS_MIRROR = this.originalIsMirror;
    });

    describe('when the environment variable IS_MIRROR is present', function () {
      beforeEach(function () {
        process.env.IS_MIRROR = '1';
      });

      it('returns true', function () {
        var isMirror = Meteor.call('velocity/isMirror');
        expect(isMirror).toBe(true);
      });
    });

    describe('when the environment variable IS_MIRROR is not present', function () {
      beforeEach(function () {
        delete process.env.IS_MIRROR;
      });

      it('returns false', function () {
        var isMirror = Meteor.call('velocity/isMirror');
        expect(isMirror).toBe(false);
      });
    });

  });

});
