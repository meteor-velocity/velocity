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

    Template.meteorTestRunner.aggregateResult = function () {
        return MeteorTestRunnerAggregateReports.findOne('result');
    };

    Template.meteorTestRunner.overlayVisibility = function () {
        return amplify.store('meteorTestRunnerOverlayIsVisible')?'block':'none';
    }

    Template.meteorTestRunner.events({
        'click #meteor-test-runner-status-widget': function () {
            $('#meteor-test-runner-overlay').toggle();
            amplify.store('meteorTestRunnerOverlayIsVisible', $('#meteor-test-runner-overlay').is(':visible'));
        }
    });

});