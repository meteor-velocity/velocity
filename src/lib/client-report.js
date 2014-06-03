Template.velocityTestFiles.testFiles = function () {
  return VelocityTestFiles.find();
};

Template.velocityTestReports.testReports = function () {
  return VelocityTestReports.find();
};

Template.velocityAggregateReports.aggregateReports = function () {
  return VelocityAggregateReports.find();
};

Template.velocityLogs.logs = function () {
  return VelocityLogs.find();
};

Template.velocity.statusWidgetClass = function () {
  var aggregateResult = VelocityAggregateReports.findOne({name: 'aggregateResult'})
  console.log('aggregateResult', aggregateResult);
  if (aggregateResult && aggregateResult.result === 'failed') {
    return  'failed';
  }

  var aggregateComplete = VelocityAggregateReports.findOne({name: 'aggregateComplete'});
  if (aggregateComplete && aggregateResult.result === 'passed' && aggregateComplete.result === 'completed') {
    return 'passed';
  }
  console.log('pending');
  return 'pending';
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