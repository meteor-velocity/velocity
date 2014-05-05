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
            return file.substr(file.lastIndexOf('/'), file.lastIndexOf('.') + 1);
        },
        extractPath = function (file) {
            var path = file.substr(ABSOLUTE_TESTS_DIR.length + 1);
            path = path.substr(0, path.lastIndexOf('/') + 1);
            if (path.indexOf('./') === 0) {
                path = path.substring(2);
            }
            return path;
        },
        addTestFile = function (filename, path) {
            if (filename.match(GENERIC_TEST_REGEX)) {
                VelocityTestFiles.insert({
                    _id: ABSOLUTE_TESTS_DIR + '/' + path + filename,
                    name: filename,
                    absolutePath: ABSOLUTE_TESTS_DIR + '/' + path + filename,
                    relativePath: path + filename,
                    path: path,
                    targetFramework: _.filter(FRAMEWORKS, function (framework) {
                        return filename.match('-' + framework + SOURCE_CODE_FILE_EXTENSIONS_REGEX);
                    })[0],
                    lastModified: Date.now()
                });
            }
        },
        addAllWatchedFiles = function () {
            watcher.relative(Meteor.bindEnvironment(function (err, files) {
                _.forIn(files, function (dirFiles, path) {
                    _.forEach(dirFiles, function (filename) {
                        if (path.indexOf('./') === 0) {
                            path = path.substring(2);
                        }
                        addTestFile(filename, path);
                    })
                });
            }));
        },

        reset = function () {
            VelocityTestFiles.remove({});
            VelocityTestReports.remove({});
            VelocityAggregateReports.remove({});
            VelocityAggregateReports.insert({
                _id: 'result',
                name: 'Aggregate Result',
                result: 'pending'
            });
        },
        updateAggregateReports = function () {
            if (!VelocityTestReports.findOne({result: ''})) {
                VelocityAggregateReports.update('result', {$set: { result: VelocityTestReports.findOne({result: 'failed'}) ? 'failed' : 'passed'}});
            }
        };

    Meteor.methods({
        reset: function () {
            reset();
            addAllWatchedFiles();
        },
        resetReports: function (options) {
            var query = {};
            if (options.framework) {
                query.framework = options.framework;
            }
            if (options.notIn) {
                query = _.assign(query, {_id: {$nin: options.notIn }});
            }
            VelocityTestReports.remove(query);
            updateAggregateReports();
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
                'failureType',
                'failureMessage',
                'failureStackTrace',
                'ancestors'
            ], function (option) {
                if (options[option]) {
                    result[option] = options[option];
                } else {
                    result[option] = '';
                }
            });

            var existingResult = VelocityTestReports.findOne(options.id);
            if (existingResult) {
                VelocityTestReports.update(options.id, {$set: result});
            } else {
                VelocityTestReports.insert(_.extend(result, {_id: options.id}));
            }
            updateAggregateReports();
        }
    });

    watcher.on('added', Meteor.bindEnvironment(function (file) {
        if (!VelocityTestFiles.findOne(file)) {
            addTestFile(extractFilename(file), extractPath(file));
        }
    }));

    watcher.on('changed', Meteor.bindEnvironment(function (file) {
        VelocityTestFiles.update(file, { $set: {lastModified: Date.now()}});
    }));

    watcher.on('deleted', Meteor.bindEnvironment(function (file) {
        VelocityTestFiles.remove(file);
    }));

    Meteor.call('reset');

    console.log('- - - VELOCITY IS IN WATCH MODE - - -');

}));
