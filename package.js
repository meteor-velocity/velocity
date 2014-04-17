Package.describe({
    summary: "Meteor Test Runner "
});

Npm.depends({
    "gaze": "0.6.3",
    "lodash": "2.4.1"
});

Package.on_use(function (api) {

    api.use(['templating'], 'client');

    api.add_files('lib/collections.js', ['client', 'server']);
    api.export('__MTR_TESTS__', ['client', 'server']);


    api.add_files('lib/main.js', 'server');

    api.add_files('lib/report.js', 'client');
    api.add_files('lib/report.html', 'client');

});