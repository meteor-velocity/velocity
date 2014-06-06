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
  if (aggregateResult && aggregateResult.result === 'failed') {
    return  'failed';
  }

  var aggregateComplete = VelocityAggregateReports.findOne({name: 'aggregateComplete'});
  if (aggregateComplete && aggregateResult.result === 'passed' && aggregateComplete.result === 'completed') {
    return 'passed';
  }
  return 'pending';
};

Template.velocity.overlayIsVisible = function () {
  return amplify.store('velocityOverlayIsVisible') ? 'block' : 'none';
};

Template.velocityAggregateReports.isVisible = function () {
  return amplify.store('velocityAggregateReportsIsVisible') ? 'block' : 'none';
};
Template.velocityTestReports.isVisible = function () {
  return amplify.store('velocityTestReportsIsVisible') ? 'block' : 'none';
};
Template.velocityTestFiles.isVisible = function () {
  return amplify.store('velocityTestFilesIsVisible') ? 'block' : 'none';
};
Template.velocityLogs.isVisible = function () {
  return amplify.store('velocityLogsIsVisible') ? 'block' : 'none';
};

Template.velocity.events({
  'click .display-toggle': function (ev) {
    var targetId = $(ev.target).data('target'),
        $target = $('#' + targetId);
    $target.toggle();
    amplify.store(targetId + 'IsVisible', $target.is(':visible'));
  }
});