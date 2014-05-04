Meteor.startup(function () {

    Template.velocityTestFiles.testFiles = function () {
        return VelocityTestFiles.find();
    };

    Template.velocityTestReports.testReports = function () {
        return VelocityTestReports.find();
    };

    Template.velocityAggregateReports.aggregateReports = function () {
        return VelocityAggregateReports.find();
    };

    Template.velocity.aggregateResult = function () {
        return VelocityAggregateReports.findOne('result');
    };

    Template.velocity.overlayVisibility = function () {
        return amplify.store('velocityOverlayIsVisible') ? 'block' : 'none';
    };

    Template.velocity.events({
        'click #velocity-status-widget': function () {
            var $overlay = $('#velocity-overlay');
            $overlay.toggle();
            amplify.store('velocityOverlayIsVisible', $overlay.is(':visible'));
        }
    });

});