Meteor.startup(function (){
    Template['__mtr_report__'].testFiles = function () {
        return __MTR_TESTS__.find();
    };
    Template['__mtr_report_test_file__'].checked = function () {
        return this.hasRun?'checked':'';
    };
});