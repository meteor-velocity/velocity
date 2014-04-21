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
        return amplify.store('meteorTestRunnerOverlayIsVisible') ? 'block' : 'none';
    };

    Template.meteorTestRunner.events({
        'click #meteor-test-runner-status-widget': function () {
            var $overlay = $('#meteor-test-runner-overlay');
            $overlay.toggle();
            amplify.store('meteorTestRunnerOverlayIsVisible', $overlay.is(':visible'));
        }
    });

});