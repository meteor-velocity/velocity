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
                MeteorTestRunnerTestFiles.insert({
                    _id: TESTS_DIR + '/' + path + filename,
                    name: filename,
                    absolutePath: TESTS_DIR + '/' + path + filename,
                    relativePath: path + filename,
                    path: path,
                    targetFramework: _.filter(FRAMEWORKS, function (framework) {
                        return  filename.match('-' + framework + '.(coffee|js)');
                    }),
                    lastModified: Date.now()
                });
            }
        },
        reset = function () {
            MeteorTestRunnerTestFiles.remove({});
            MeteorTestRunnerTestReports.remove({});
            MeteorTestRunnerAggregateReports.remove({});
            MeteorTestRunnerAggregateReports.insert({
                _id: 'result',
                name: 'Aggregate Result',
                result: 'pending'
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
        updateAggregateReports = function () {
            if (!MeteorTestRunnerTestReports.findOne({result: ''})) {
                MeteorTestRunnerAggregateReports.update('result', {$set: { result: MeteorTestRunnerTestReports.findOne({result: 'fail'}) ? 'fail' : 'pass'}});
            }
        };

    reset();
    addAllWatchedFiles();

    Meteor.methods({
        reset: function () {
            reset();
            addAllWatchedFiles();
        },
        startTest: function (testId, framework, title) {
            var initialReportData = {
                framework: framework,
                title: title,
                startTime: Date.now()
            };
            if (!MeteorTestRunnerTestReports.update(testId, {$set: initialReportData})) {
                _.extend(initialReportData, {_id: testId});
                MeteorTestRunnerTestReports.insert(initialReportData);
            }
        },
        postResult: function (testId, result) {
            var now = Date.now(),
                duration = now - MeteorTestRunnerTestReports.findOne(testId).startTime;
            MeteorTestRunnerTestReports.update(testId, {$set: {
                result: result,
                duration: duration,
                endTime: now
            }});
            updateAggregateReports();
        }
    });

    watcher.on('added', Meteor.bindEnvironment(function (file) {
        // For some reason, Gaze fires both added and changed events together when files change, but not always!
        // So here we check if we already have this test in the collection
        console.log('added', file);
        if (!MeteorTestRunnerTestFiles.findOne(file)) {
            console.log('added', file);
            addTestObject(extractFilename(file), extractPath(file));
        }
    }));

    watcher.on('changed', Meteor.bindEnvironment(function (file) {
        console.log('changed', file);
        MeteorTestRunnerTestFiles.update(file, { $set: {lastModified: Date.now()}});
    }));

    // This seems a little flaky in Gaze and doesn't always fire
    watcher.on('deleted', Meteor.bindEnvironment(function (file) {
        console.log('deleted', file);
        MeteorTestRunnerTestFiles.remove(file);
    }));
}));
