"use strict";

// TODO Externalize these to a conf file
var FRAMEWORKS = ['rtd-unit', 'mocha-web'],
    SOURCE_CODE_FILE_EXTENSIONS = ['js', 'coffee'],
    TESTS_DIR = '/tests';

var gaze = Npm.require('gaze'),
    _ = Npm.require('lodash'),
    SOURCE_CODE_FILE_EXTENSIONS_REGEX = '.(' + SOURCE_CODE_FILE_EXTENSIONS.join('|') + ')',
    GENERIC_TEST_REGEX = '-(' + FRAMEWORKS.join('|') + ')' + SOURCE_CODE_FILE_EXTENSIONS_REGEX,
    ABSOLUTE_TESTS_DIR = process.env.PWD + TESTS_DIR,
    FILE_WATCHER_MATCHING_PATTERN = _.map(SOURCE_CODE_FILE_EXTENSIONS, function (extension) {
        return '**/*.' + extension
    });

gaze(FILE_WATCHER_MATCHING_PATTERN, {cwd: ABSOLUTE_TESTS_DIR}, Meteor.bindEnvironment(function (err, watcher) {

    var extractFilename = function (file) {
            return file.substr(file.lastIndexOf('.') + 1);
        },
        extractPath = function (file) {
            var path = file.substr(ABSOLUTE_TESTS_DIR.length + 1);
            return path.substr(0, path.lastIndexOf('/') + 1);
        },
        addTestObject = function (filename, path) {
            if (filename.match(GENERIC_TEST_REGEX)) {
                MeteorTestRunnerTestFiles.insert({
                    _id: ABSOLUTE_TESTS_DIR + '/' + path + filename,
                    name: filename,
                    absolutePath: ABSOLUTE_TESTS_DIR + '/' + path + filename,
                    relativePath: path + filename,
                    path: path,
                    targetFramework: _.filter(FRAMEWORKS, function (framework) {
                        return  filename.match('-' + framework + SOURCE_CODE_FILE_EXTENSIONS_REGEX);
                    }),
                    lastModified: Date.now()
                });
            }
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
        postResult: function (options) {

            if (!options || !options.id || !options.name || !options.framework || !options.result) {
                throw new Error('id, name, framework and result are required fields.')
            }

            var result = {
                name: options.name,
                framework: options.framework,
                result: options.result
            };

            _.each([
                'timestamp',
                'time',
                'async',
                'timeOut',
                'pending',
                'errorMessage',
                'ancestors'
            ], function (option) {
                if (options[option]) {
                    result[option] = options[option];
                }
            });

            MeteorTestRunnerTestReports.update(options.id, {$set: result});

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

    // FIXME This seems a little flaky in Gaze and doesn't always fire. May be linked to issue in added event
    watcher.on('deleted', Meteor.bindEnvironment(function (file) {
        console.log('deleted', file);
        MeteorTestRunnerTestFiles.remove(file);
    }));
}));
