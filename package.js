Package.describe({
    summary: "Meteor Test Runner "
});

Npm.depends({
    "gaze": "0.6.4",
    "lodash": "2.4.1"
});

Package.on_use(function (api) {

    api.use(['templating', 'amplify'], 'client');

    api.add_files('lib/collections.js', ['client', 'server']);
    api.export('MeteorTestRunnerTestFiles', ['client', 'server']);
    api.export('MeteorTestRunnerTestReports', ['client', 'server']);
    api.export('MeteorTestRunnerAggregateReports', ['client', 'server']);

    api.add_files('lib/main.js', 'server');

    api.add_files('lib/client-report.js', 'client');
    api.add_files('lib/client-report.html', 'client');

});