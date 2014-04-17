"use strict";

var FILE_WATCHER_MATCHING_PATTERN = ['**/*.js', '**/*.coffee'],
    TESTS_DIR = process.env.PWD + '/tests',
    UNIT_TEST_REGEX = '-rtd-unit.(coffee|js)',
    MOCHA_WEB_TEST_REGEX = '-mocha-web.(coffee|js)',
    gaze = Npm.require('gaze'),
    _ = Npm.require('lodash');

__MTR_TESTS__.remove({});

gaze(FILE_WATCHER_MATCHING_PATTERN, {cwd: TESTS_DIR},
    Meteor.bindEnvironment(function (err, watcher) {

        var extractFilename = function (file) {
                return file.substr(file.lastIndexOf('/') + 1);
            },
            extractPath = function (file) {
                var path = file.substr(TESTS_DIR.length + 1);
                return path.substr(0, path.lastIndexOf('/') + 1);
            },
            addTestObject = function (filename, path) {
                var testFile = {
                    _id: TESTS_DIR + '/' + path + filename,
                    name: filename,
                    absolutePath: TESTS_DIR + '/' + path + filename,
                    relativePath: path + filename,
                    path: path,
                    hasRun: false
                };

                if (filename.match(UNIT_TEST_REGEX)) {
                    testFile['rtd-unit'] = {
                    };
                    __MTR_TESTS__.insert(testFile);
                }

                if (filename.match(MOCHA_WEB_TEST_REGEX)) {
                    testFile['mocha-web'] = {
                    };
                    __MTR_TESTS__.insert(testFile);
                }
            };

        watcher.on('added', Meteor.bindEnvironment(function (file) {
            // For some reason, Gaze fires both added and changed events together when files change, but not always!
            // So here we check if we already have this test in the collection
            console.log('added', file);
            if (!__MTR_TESTS__.findOne(file)) {
                console.log('added', file);
                addTestObject(extractFilename(file), extractPath(file));
            }
        }));

        watcher.on('changed', Meteor.bindEnvironment(function (file) {
            console.log('changed', file);
            __MTR_TESTS__.update(file, { $set: {hasRun: true}});
        }));

        // This seems a little flaky in Gaze and doesn't always fire
        watcher.on('deleted', Meteor.bindEnvironment(function (file) {
            console.log('deleted', file);
            __MTR_TESTS__.remove(file);
        }));

        watcher.relative(Meteor.bindEnvironment(function (err, files) {
            _.forIn(files, function (dirFiles, path) {
                _.forEach(dirFiles, function (filename) {
                    addTestObject(filename, path);
                })
            });
        }));
    })
);
