Velocity
========

Test runner (and community) for Meteor apps.  Under heavy development.


##Why Velocity?

The Meteor-provided testing framework, TinyTest, works great for testing packages but doesn't work for apps.  Many members of the community created their own solutions but recently we wondered what would happen if we got everybody together and tried to unify our efforts.

Velocity is the result - the unified testing framework for Meteor.

Find out more by watching the [Intro to Velocity](http://youtu.be/kwFv1mXrLWE?t=40m51s) talk that Robert, Sam, and Mike did at the June 2014 Meteor Devshop!


##Benefits

- officially sanctioned by the Meteor Development Group
- install with one line
- test your whole app, not just packages
- tests run in containers completely isolated from your app
- one report shows all framework results reactively
- easy CI integration


##Example app


```bash
$ cd ~/tmp
$ git clone https://github.com/xolvio/velocity-example.git
$ cd velocity-example
$ mrt
```

You'll see the leaderboard example started on port 3000.

You'll also see a green dot in the top right. If any tests are failing, this will go red. Clicking the dot will show you the reports.

Try to modify the tests and watch the tests update reactively in the browser.


## Current Frameworks

The `velocity` package coordinates between test frameworks and provides a common structure for getting test results.  Velocity by itself does not perform any tests.  To actually test your app, use one or more of the velocity-compatible test frameworks listed below:

* [mocha-web-velocity](https://github.com/mad-eye/meteor-mocha-web) - A Velocity version of mocha-web.  Runs mocha tests in the Meteor context which is great for integration testing.
* [jasmine-unit](https://github.com/xolvio/jasmine-unit) - Runs jasmine unit tests out of the Meteor context.  Fast and good for smaller unit tests.
* [meteor-cucumber](https://github.com/xdissent/meteor-cucumber) - Velocity-compatible [CucumberJS](https://github.com/cucumber/cucumber-js) runner for Meteor
* [jasmine](https://github.com/Sanjo/meteor-jasmine) - run client tests in the browser within the app context.
* [selenium-nightwatch](https://github.com/awatson1978/selenium-nightwatch/) - run acceptance tests in real browsers using Selenium and Nightwatch


##Contributors

We are collaborating with an all-star team on unifying the Meteor testing landscape:

* [Sam Hatoum](https://github.com/samhatoum) from [Xolv.io](http://xolv.io/), author of [RTD](https://github.com/xolvio/rtd)
* [Arunoda Susiripala](https://github.com/arunoda) from [MeteorHacks](meteorhacks.com), author of [Laika](http://arunoda.github.io/laika/)
* [Adrian Lanning](https://github.com/alanning) from [Share911](http://about.share911.com/), contributor to [all things Meteor](https://github.com/alanning?tab=repositories)
* [Mike Risse](https://github.com/rissem) from [MadEye](https://madeye.io/), author of [mocha-web](https://github.com/mad-eye/meteor-mocha-web)
* [Greg Thornton](https://github.com/xdissent) author of [meteor-cucumber](https://github.com/xdissent/meteor-cucumber)
* [Ronen Babayoff](https://github.com/ronen-lavaina) from LaVaina Inc, co-author of [Munit](https://github.com/spacejamio/meteor-munit)
* [Abigail Watson](https://github.com/awatson1978) from [Pentasyllabic](http://www.pentasyllabic.com), author of [Meteor Cookbook](https://github.com/awatson1978/meteor-cookbook), [Selenium-Nightwatch](https://github.com/awatson1978/selenium-nightwatch/)
* [Robert Dickert](https://github.com/rdickert) from [Meteor Boulder](http://www.meetup.com/Meteor-Boulder), contributor to [all things Meteor](https://github.com/rdickert?tab=repositories)
* [Ry Walker](https://github.com/ryw) from [Differential](http://differential.io/), co-author of [Testing with Meteor](http://testingmeteor.com/)
* [Josh Owens](https://github.com/queso) from [Differential](http://differential.io/), co-author of [Testing with Meteor](http://testingmeteor.com/)
* [Jonas](https://github.com/sanjo), velocity contributor, [Jasmine](https://github.com/Sanjo/meteor-jasmine) package

Please join our discussions at the [velocity-core](https://groups.google.com/forum/#!forum/velocity-core) google group.


## Debug output

Sometimes things break and its useful to get more debugging info.  Most of the test frameworks support some kind of debugging environment variable flag.  You can usually see a lot more details about what's happening if you run your app with this command:

```bash
$ DEBUG=1 JASMINE_DEBUG=1 VELOCITY_DEBUG=1 mrt
```

## Troubleshooting

* `Error: There was a problem checking out branch: master`

Used to be encountered when you referenced the velocity repo directly in `smart.json`. Was because we tried using a submodule for the example app but meteorite doesn't play well with submodules.  If you are still running into this one,  see [Issue #37](https://github.com/xolvio/velocity/issues/37) for a fix.
