Meteor.startup(function () {

    Template['__mtr_report__'].testFiles = function () {
        return __MTR_TESTS__.find();
    };

    Template['__mtr_report__'].runnerResult = function () {
        var runnerReport = __MTR_REPORTS__.findOne('runner');
        return runnerReport?runnerReport.result:'';
    };


    // SIMULATION STUFF
    Template['__mtr_report_test_file__'].events({
        'click .pass': function () {
            Meteor.call('setResult', this._id, 'pass');
        },
        'click .fail': function () {
            Meteor.call('setResult', this._id, 'fail');
        }
    });
    Template['__mtr_report__'].events({
        'click .reset': function () {
            Meteor.call('reset');
        },
        'click #__mtr_status_widget__' : function() {
            $('#__mtr_report_overlay__').toggle();
        }
    });

});