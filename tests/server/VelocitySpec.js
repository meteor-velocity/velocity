'use strict';

describe('Velocity', function () {
  it('is available via Package["velocity:core"].Velocity', function () {
    expect(Package['velocity:core'].Velocity).toBeDefined();
  });
});

describe('Velocity Methods', function () {

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
