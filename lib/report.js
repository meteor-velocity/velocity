Meteor.startup(function () {

    Template.meteorTestRunnerTestFiles.testFiles = function () {
        return MeteorTestRunnerTestFiles.find();
    };

    Template.meteorTestRunnerTestReports.testReports = function () {
        return MeteorTestRunnerTestReports.find();
    };

    Template.meteorTestRunnerAggregateReports.aggregateReports = function () {
        return MeteorTestRunnerAggregateReports.find();
    };

});