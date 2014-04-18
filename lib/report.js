Meteor.startup(function () {
    Template['__mtr_report__'].testFiles = function () {
        return __MTR_TESTS__.find();
    };
    Template['__mtr_report__'].allTestsHaveRun = function () {
        return __MTR_TESTS__.findOne({completed: false}) ? 'No' : 'Yes';
    };
    Template['__mtr_report_test_file__'].testCompleted = function () {
        return this.completed ? 'Yes' : 'No';
    };
    Template['__mtr_report_test_file__'].events({
        'click button': function () {
            __MTR_TESTS__.update(this._id, {$set: { completed: true}});
        }
    });
});