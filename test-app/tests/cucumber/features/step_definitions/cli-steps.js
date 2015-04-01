(function () {

  'use strict';

  module.exports = function () {

    var fs = Package['xolvio:cucumber'].cucumber.fs,
        assert = require('assert'),
        path = require('path'),
        spawn = require('child_process').spawn;

    var helper = this;

    var stdOutMessages = [],
        stdErrMessages = [];

    this.Given(/^I deleted the folder called "([^"]*)"$/, function (folder, callback) {
      fs.remove(_resolveToCurrentDir(folder), callback);
    });


    this.Given(/^I created a folder called "([^"]*)"$/, function (folder, callback) {
      fs.mkdirs(_resolveToCurrentDir(folder), callback);
    });


    this.Given(/^I created a file called "([^"]*)" with$/, function (file, text, callback) {
      fs.outputFile(_resolveToCurrentDir(file), text, callback);
    });

    this.When(/^I run cuke-monkey inside "([^"]*)"$/, function (directory, callback) {

      var proc = spawn(path.join(process.env.PWD, 'bin/cuke-monkey'), [], {
        cwd: _resolveToCurrentDir(directory),
        stdio: null
      });

      proc.stdout.on('data', function (data) {
        stdOutMessages.push(data.toString());
      });

      proc.stderr.on('data', function (data) {
        stdErrMessages.push(data.toString());
      });

      proc.on('exit', function (code) {
        if (code !== 0) {
          callback.fail('Exit code was ' + code);
        } else {
          callback();
        }

      });

    });

    this.Then(/^I see "([^"]*)" in the console$/, function (message, callback) {
      if (stdOutMessages.join().indexOf(message) !== -1) {
        callback();
      } else {
        callback.fail(message + ' was not seen in the console log');
      }


    });




    this.Given(/^I ran "([^"]*)"$/, _runCliCommand);

    this.Given(/^I changed directory to "([^"]*)"$/, function (directory, callback) {
      helper.world.cwd = path.resolve(helper.world.cwd, directory);
      callback();
    });


    this.Given(/^I started meteor$/, function (callback) {

      var toOmit = [
        'ROOT_URL',
        'PORT',
        'MOBILE_DDP_URL',
        'MOBILE_ROOT_URL',
        'MONGO_OPLOG_URL',
        'MONGO_URL',
        'METEOR_PRINT_ON_LISTEN',
        'METEOR_PARENT_PID',
        'TMPDIR',
        'APP_ID',
        'OLDPWD'
      ];

      var currentEnv = _.omit(process.env, toOmit);

      helper.world.meteor = spawn('meteor', ['-p', '3030'], {
        cwd: helper.world.cwd,
        stdio: null,
        detached: true,
        env: currentEnv
      });

      var onMeteorData = Meteor.bindEnvironment(function (data) {
        var stdout = data.toString();
        //console.log('[meteor-output]', stdout);
        if (stdout.match(/=> App running at/i)) {
          //console.log('[meteor-output] Meteor started');
          helper.world.meteor.stdout.removeListener('data', onMeteorData);
          callback();
        }
      });
      helper.world.meteor.stdout.on('data', onMeteorData);

    });


    this.Given(/^I symlinked the "([^"]*)" generic framework to this directory$/,
      function (genericPackage, callback) {
        var genericPackagePath = path.resolve(
          process.env.PWD, '../generic-frameworks', genericPackage);
        _runCliCommand('ln -s ' + genericPackagePath + ' .', callback);
      });

    function _resolveToCurrentDir (location) {
      return path.join(helper.world.cwd, location);
    }


    function _runCliCommand (runLine, callback) {

      var splitCommand = runLine.split(' ');
      var command = splitCommand.splice(0, 1)[0];

      var proc = spawn(command, splitCommand, {
        cwd: helper.world.cwd,
        stdio: null,
        env: process.env
      });

      //proc.stdout.on('data', function (data) {
      //  console.log(data.toString());
      //});
      //
      //proc.stderr.on('data', function (data) {
      //  console.error(data.toString());
      //});

      proc.on('exit', function (code) {
        if (code !== 0) {
          callback.fail('Exit code was ' + code);
        } else {
          callback();
        }

      });
    }




    this.Then(/^I should see a green dot in the the velocity html reporter$/, function (callback) {
      // FIXME should be .passed when it's green
      helper.world.browser
        .call(callback);
    });

    this.Then(/^I click the green dot$/, function (callback) {
      // Write code here that turns the phrase above into concrete actions
      helper.world.browser.execute(function () { $('button.display-toggle').click(); }).call(callback);
    });

    this.Then(/^I should see "([^"]*)" in the Velocity reporter$/, function (elementText, callback) {
      helper.world.browser
        .getText('div.velocity-summary-text', function (err, text) {
          console.log(err)
          assert(text.indexOf(elementText) !== -1, elementText + ': NOT FOUND');
          callback();
        });
    });

    this.When(/^I navigate to "([^"]*)"$/, function (path, callback) {
      helper.world.browser.
        url(path).
        call(callback);
    });

    this.When(/^I click the Velocity reporter button$/, function (callback) {
      helper.world.browser
        .click('button.display-toggle')
        .call(callback);
    });

    this.Then(/^I should see a button labelled "([^"]*)"$/, function (elementText, callback) {
      helper.world.browser
        .getText('button.', function (err, text) {
          assert(text.indexOf(elementText) !== -1, elementText + ': NOT FOUND');
          callback();
        });
    });




    this.When(/^DEBUG pause (\d+)$/, function (milliseconds, callback) {
      helper.world.browser.
        pause(milliseconds).
        call(callback);
    });

    this.When(/^DEBUG take screenshot$/, function (callback) {
      helper.world.browser.
        takeScreenshot().
        call(callback);
    });




  };

})();
