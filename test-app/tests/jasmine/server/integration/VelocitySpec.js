'use strict';

describe('Velocity', function () {
  it('is available via Package["velocity:core"].Velocity', function () {
    expect(Package['velocity:core'].Velocity).toBeDefined();
  });

  it('getOption returns option', function () {
    var name,
        value,
        actual;

    name = 'foo';
    value = 'bar';
    Meteor.call('velocity/setOption', name, value);
    actual = Velocity.getOption(name);
    expect(actual).toEqual(value);
  });

  it('setOption sets an option', function () {
    var name,
        value,
        actual;

    name = 'foo';
    value = 'bar';
    Velocity.setOption(name, value);
    actual = Velocity.Collections.Options.findOne({name: name});
    expect(actual.value).toEqual(value);
  });

  describe('registerTestingFramework', function () {
    afterEach(function () {
      Velocity.unregisterTestingFramework('foo');
    });

    it('creates a pending aggregate report', function () {
      var options = {
            color: 'blue'
          },
          report;

      Velocity.registerTestingFramework('foo', options);
      report = Velocity.Collections.AggregateReports.findOne({name: 'foo'});
      expect(report.result).toBe('pending');
    });
  });

});
