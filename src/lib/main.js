"use strict";

// TODO Externalize these to a conf file
var FRAMEWORKS = ['jasmine-unit', 'mocha-web'],
    SOURCE_CODE_FILE_EXTENSIONS = ['js', 'coffee'],
    TESTS_DIR = '/tests';

var _ = Npm.require('lodash'),
    path = Npm.require('path'),
    SOURCE_CODE_FILE_EXTENSIONS_REGEX = '.(' + SOURCE_CODE_FILE_EXTENSIONS.join('|') + ')',
    GENERIC_TEST_REGEX = '-(' + FRAMEWORKS.join('|') + ')' + SOURCE_CODE_FILE_EXTENSIONS_REGEX,
    ABSOLUTE_TESTS_DIR = process.env.PWD + TESTS_DIR;

var initWatcher = function () {
    return Npm.require('chokidar').watch(ABSOLUTE_TESTS_DIR, {ignored: /[\/\\]\./})
        .on('add', Meteor.bindEnvironment(function (filePath) {

            console.log('File', 'has been added', filePath);

            filePath = path.normalize(filePath);

            var relativeDir = path.relative(ABSOLUTE_TESTS_DIR, path.dirname(filePath)),
                filename = path.basename(filePath);

            if (filename.match(GENERIC_TEST_REGEX)) {
                VelocityTestFiles.insert({
                    _id: filePath,
                    name: filename,
                    absolutePath: path.join(ABSOLUTE_TESTS_DIR, relativeDir, filename),
                    relativePath: path.join(relativeDir, filename),
                    targetFramework: _.filter(FRAMEWORKS, function (framework) {
                        return filename.match('-' + framework + SOURCE_CODE_FILE_EXTENSIONS_REGEX);
                    })[0],
                    lastModified: Date.now()
                });
            }
        }))
        .on('change', Meteor.bindEnvironment(function (filePath) {
            console.log('File', filePath, 'has been changed');
            VelocityTestFiles.update(filePath, { $set: {lastModified: Date.now()}});
        }))
        .on('unlink', Meteor.bindEnvironment(function (filePath) {
            console.log('File', filePath, 'has been removed');
            // If we only remove the file, we also need to remove the test results for just that file. This required
            // changing the postResult API and we could do it, but the brute force method of reset() will do the trick
            // until we want to optimize
//            VelocityTestFiles.remove(filePath);
            reset();
        }));
};

var watcher = initWatcher();

var reset = function () {
    watcher.close();
    VelocityTestFiles.remove({});
    VelocityTestReports.remove({});
    VelocityAggregateReports.remove({});
    VelocityAggregateReports.insert({
        _id: 'result',
        name: 'Aggregate Result',
        result: 'pending'
    });
    watcher = initWatcher();
};

var updateAggregateReports = function () {
    if (!VelocityTestReports.findOne({result: ''})) {
        VelocityAggregateReports.update('result', {$set: { result: VelocityTestReports.findOne({result: 'failed'}) ? 'failed' : 'passed'}});
    }
};

Meteor.methods({
    reset: function () {
        reset();
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

Meteor.call('reset');