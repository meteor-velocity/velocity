Jasmine.onTest(function () {
  'use strict';

  describe('Velocity', function () {
    it('is available via Package["velocity:core"].Velocity', function () {
      expect(Package['velocity:core'].Velocity).toBeDefined();
    });
  });
});
