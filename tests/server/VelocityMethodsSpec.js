'use strict';

describe('Velocity Methods', function () {

  describe('velocity/setOption', function () {
    it('sets an option', function () {
      var name,
          value,
          expected,
          actual;
          
      name = "foo";
      value = "bar";
      Meteor.call('velocity/setOption', name, value);
      actual = VelocityOptions.findOne({name: name});
      expect(actual.value).toEqual(value);
    });
  });

  describe('velocity/getOption', function () {
    it('gets an option', function () {
      var name,
          value,
          expected,
          actual;
          
      name = "foo";
      value = "bar";
      Meteor.call('velocity/setOption', name, value);
      actual = Meteor.call('velocity/getOption', name);
      expect(actual).toEqual(value);
    });
  });

  describe('velocity/setOptions', function () {
    it('sets multiple options', function () {
      var options = {
            "foo": "bar",
            "foo2": "baz",
            "number": 1
          },
          actual;
          
      Meteor.call('velocity/setOptions', options);
      actual = VelocityOptions.findOne({name: "foo"});
      expect(actual.value).toEqual("bar");

      actual = VelocityOptions.findOne({name: "foo2"});
      expect(actual.value).toEqual("baz");

      actual = VelocityOptions.findOne({name: "number"});
      expect(actual.value).toEqual(1);
    });
  });

  describe('velocity/isEnabled', function () {
    beforeEach(function () {
      this.original = process.env.VELOCITY;
    });

    afterEach(function () {
      process.env.VELOCITY = this.original;
    });

    it('returns false when environment variable is not set', function () {
      var actual;

      delete process.env.VELOCITY;

      actual = Meteor.call('velocity/isEnabled');
      expect(actual).toBe(false);
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
