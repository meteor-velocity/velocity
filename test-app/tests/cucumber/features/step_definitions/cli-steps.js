(function () {

  'use strict';

  module.exports = function () {

    var fs = Package['xolvio:cucumber'].cucumber.fs,
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
          console.log('[meteor-output] Meteor started', stdout);
          helper.world.meteor.stdout.removeListener('data', onMeteorData);
          callback();
        }
      });
      helper.world.meteor.stdout.on('data', onMeteorData);

    });


    this.Given(/^I create a fresh meteor project called "([^"]*)"$/, function (arg1, callback) {
      _runCliCommand('rm -rf myApp', function () {
        _runCliCommand('meteor create myApp', callback);
      });
    });


    this.Given(/^I install the generic testing framework in "([^"]*)"$/, function (appName, callback) {

      //And   I created a folder called "myApp/packages"
      fs.mkdirsSync(_resolveToCurrentDir(path.join(appName, 'packages')));

      //And   I changed directory to "myApp/packages"
      helper.world.cwd = path.resolve(helper.world.cwd, path.join(appName, 'packages'));

      //And   I symlinked the generic framework to this directory
      var velocityPackagePath = path.resolve(process.env.PWD, '..', 'src');
      var genericPackagePath = path.resolve(process.env.PWD, '..', 'generic-framework');

      _runCliCommand('ln -s ' + velocityPackagePath + ' .', function () {
        _runCliCommand('ln -s ' + genericPackagePath + ' .', function () {
          helper.world.cwd = path.resolve(helper.world.cwd, '..');
          //And   I ran "meteor add velocity:generic-test-framework"
          _runCliCommand('meteor add velocity:generic-framework', callback);
        });
      });
    });



    this.When(/^I call "([^"]*)" via DDP$/, function (method, callback) {
      var app = DDP.connect('http://localhost:3030');
      app.call(method, {framework: 'generic'}, function (e) {
        if (e) {
          callback.fail(e);
        } else {
          callback();
        }
      });
    });


    this.Then(/^I should see the file "([^"]*)"$/, function (file, callback) {
      fs.exists(path.resolve(helper.world.cwd, file), function(exists){
        if (exists) {
          callback();
        } else {
          callback.fail('Could not find the file ' + file);
        }
      });

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
      //  console.log('[cli]', data.toString());
      //});
      //
      //proc.stderr.on('data', function (data) {
      //  console.error('[cli]', data.toString());
      //});

      proc.on('exit', function (code) {
        if (code !== 0) {
          callback.fail('Exit code was ' + code);
        } else {
          callback();
        }

      });
    }




  };

})();
