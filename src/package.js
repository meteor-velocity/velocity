Package.describe({
    summary: "Velocity, a Meteor specific test-runner"
});

Npm.depends({
    "chokidar": "0.8.2",
    "lodash": "2.4.1",
    "glob": "3.2.9"
});

Package.on_use(function (api) {

    api.use(['templating', 'amplify'], 'client');

    api.add_files('lib/collections.js', ['client', 'server']);
    api.export('VelocityTestFiles', ['client', 'server']);
    api.export('VelocityTestReports', ['client', 'server']);
    api.export('VelocityAggregateReports', ['client', 'server']);
    api.export('VelocityLogs', ['client', 'server']);

    api.add_files('lib/main.js', 'server');

    api.add_files('lib/client-report.js', 'client');
    api.add_files('lib/client-report.html', 'client');

});
