(function () {

  'use strict';

  module.exports = function () {

    var helper = this;
    var os = require('os');

    this.World = function (next) {

      helper.world = this;

      helper.world.cwd = os.tmpdir();
      console.log('Working in', helper.world.cwd);

      helper.world.cucumber = Package['xolvio:cucumber'].cucumber;

      Package['xolvio:webdriver'].wdio.getGhostDriver(function (browser) {
        helper.world.browser = browser;
        browser.call(next);
      });

    };

  };

})();
