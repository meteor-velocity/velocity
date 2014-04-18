"use strict";

var FRAMEWORKS = ['rtd-unit', 'mocha-web'],
    FILE_WATCHER_MATCHING_PATTERN = ['**/*.js', '**/*.coffee'],
    TESTS_DIR = process.env.PWD + '/tests',
    GENERIC_TEST_REGEX = '-(' + FRAMEWORKS.join('|') + ').(coffee|js)',
    gaze = Npm.require('gaze'),
    _ = Npm.require('lodash');

gaze(FILE_WATCHER_MATCHING_PATTERN, {cwd: TESTS_DIR}, Meteor.bindEnvironment(function (err, watcher) {

    var extractFilename = function (file) {
            return file.substr(file.lastIndexOf('/') + 1);
        },
        extractPath = function (file) {
            var path = file.substr(TESTS_DIR.length + 1);
            return path.substr(0, path.lastIndexOf('/') + 1);
        },
        addTestObject = function (filename, path) {
            if (filename.match(GENERIC_TEST_REGEX)) {
                __MTR_TESTS__.insert({
                    _id: TESTS_DIR + '/' + path + filename,
                    name: filename,
                    absolutePath: TESTS_DIR + '/' + path + filename,
                    relativePath: path + filename,
                    path: path,
                    result: '',
                    targetFramework: _.filter(FRAMEWORKS, function (framework) {
                        return  filename.match('-' + framework + '.(coffee|js)');
                    })
                });
            }
        },
        reset = function () {
            __MTR_TESTS__.remove({});
            __MTR_REPORTS__.remove({});
            __MTR_REPORTS__.insert({
                _id: 'runner',
                result: ''
            });
        },
        addAllWatchedFiles = function () {
            watcher.relative(Meteor.bindEnvironment(function (err, files) {
                _.forIn(files, function (dirFiles, path) {
                    _.forEach(dirFiles, function (filename) {
                        addTestObject(filename, path);
                    })
                });
            }));
        },
        updateReports = function () {
            if (!__MTR_TESTS__.findOne({result: ''})) {
                __MTR_REPORTS__.update('runner', {$set: { result: __MTR_TESTS__.findOne({result: 'fail'}) ? 'fail' : 'pass'}});
            }
        };

    reset();
    addAllWatchedFiles();

    Meteor.methods({
        reset: function () {
            reset();
            addAllWatchedFiles();
        },
        setResult: function (id, result) {
            __MTR_TESTS__.update(id, {$set: { result: result}});
            updateReports();
        }
    });

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
        __MTR_TESTS__.update(file, { $set: {completed: true}});
    }));

    // This seems a little flaky in Gaze and doesn't always fire
    watcher.on('deleted', Meteor.bindEnvironment(function (file) {
        console.log('deleted', file);
        __MTR_TESTS__.remove(file);
    }));
}));
