(function () {

  // TODO: Replace process.env.PWD with getAppPath for Windows support

  'use strict';

  module.exports = function () {

    var fs = require('fs-extra'),
        _ = require('underscore'),
        path = require('path'),
        spawn = require('child_process').spawn,
        DDPClient = require('ddp');

    var stdOutMessages = [],
        stdErrMessages = [];

    var cwd = require('os').tmpdir(),
        meteor;

    process.on('exit', function () {
      if (meteor) {
        meteor.kill('SIGINT');
      }
    });

    console.log(cwd);

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

      // TODO: Not sure if that process.env.PWD works here
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
      cwd = _resolveToCurrentDir(directory);
      callback();
    });


    this.Given(/^I started meteor$/, function (callback) {

      if (meteor) {
        // Skip if meteor is already started
        callback();
        return;
      }

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
        'OLDPWD',
        'IS_MIRROR'
      ];

      var currentEnv = _.omit(process.env, toOmit);

      var command = isWindows() ? 'meteor.bat' : 'meteor';
      meteor = spawn(command, ['-p', '3030'], {
        cwd: cwd,
        stdio: 'pipe',
        env: currentEnv
      });

      var onMeteorData = function (data) {
        var stdout = data.toString();
        //console.log('[meteor-output]', stdout);
        if (stdout.match(/=> App running at/i)) {
          //console.log('[meteor-output] Meteor started', stdout);
          //meteor.stdout.removeListener('data', onMeteorData);
          callback();
        }
      };
      meteor.stdout.on('data', onMeteorData);
      meteor.stdout.pipe(process.stdout);
      meteor.stderr.pipe(process.stderr);

    });


    this.Given(/^I create a fresh meteor project called "([^"]*)"$/, function (arg1, callback) {
      fs.remove(_resolveToCurrentDir('myApp'), function () {
        _runCliCommand('meteor create myApp', callback);
      });
    });


    this.Given(/^I install the generic testing framework in "([^"]*)"$/, function (appName, callback) {

      //And   I created a folder called "myApp/packages"
      fs.mkdirsSync(_resolveToCurrentDir(path.join(appName, 'packages')));

      //And   I changed directory to "myApp/packages"
      cwd = _resolveToCurrentDir(path.join(appName, 'packages'));

      //And   I symlinked the generic framework to this directory
      var velocityPackagePath = path.resolve(process.env.PWD, '..');
      var genericPackagePath = path.resolve(process.env.PWD, '..', 'generic-framework');

      fs.copySync(velocityPackagePath, _resolveToCurrentDir('velocity-core'));
      fs.copySync(genericPackagePath, _resolveToCurrentDir('generic-framework'));
      cwd = _resolveToCurrentDir('..');
      //And   I ran "meteor add velocity:generic-test-framework"
      _runCliCommand('meteor add velocity:generic-framework', callback);
    });



    this.When(/^I call "([^"]*)" via DDP$/, function (method, callback) {
      var app = new DDPClient({
        host: 'localhost',
        port: '3030',
        ssl: false,
        autoReconnect: true,
        autoReconnectTimer: 500,
        maintainCollections: true,
        ddpVersion: '1',
        useSockJs: true
      });


      app.connect(function (error) {
        if (error) {
          console.error('DDP connection error!', error);
          callback.fail();
        } else {
          app.call(method, [{framework: 'generic'}], function (e) {
            if (e) {
              callback.fail(e.message);
            } else {
              callback();
            }
          });
        }
      });



    });


    this.Then(/^I should see the file "([^"]*)"$/, function (file, callback) {
      fs.exists(_resolveToCurrentDir(file), function(exists){
        if (exists) {
          callback();
        } else {
          callback.fail('Could not find the file ' + file);
        }
      });

    });



    function isWindows() {
      return process.platform === 'win32';
    }

    function _resolveToCurrentDir (location) {
      return path.join(cwd, location);
    }


    function _runCliCommand (runLine, callback) {

      var splitCommand = runLine.split(' ');
      var command = splitCommand.splice(0, 1)[0];

      var proc = spawn(command, splitCommand, {
        cwd: cwd,
        stdio: null,
        env: process.env
      });

      proc.stdout.on('data', function (data) {
        console.log('[cli]', data.toString());
      });

      proc.stderr.on('data', function (data) {
        console.error('[cli]', data.toString());
      });

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
