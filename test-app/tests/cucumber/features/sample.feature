Feature: Generic framework

  Scenario:
    Given I ran "rm -rf myApp"
    And   I ran "meteor create myApp"
    And   I created a folder called "myApp/packages"
    And   I changed directory to "myApp/packages"
    And   I symlinked the "integration" generic framework to this directory
    And   I changed directory to ".."
    And   I ran "meteor add velocity:generic-integration-framework"
    And   I started meteor

    When  I navigate to "http://localhost:3030"

#  FIXME the html reporter is not clickable by webdriver for some reason. Funny css maybe?
#    And   I click the Velocity reporter button
#
#    Then  I should see "0 tests passed" in the Velocity reporter
#    And   I should see a button labelled "Add generic-integration sample tests"
