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
- tests are not published to production
- only executes in dev mode (`process.env.NODE_ENV === "development"`)


## Usage

The Velocity package itself is not something that you would normally include.  Rather you would include the test framework that you would like to use ([see below](https://github.com/xolvio/velocity/#current-frameworks)) and it will automatically be added for you.

There are generally two ways people get started with using velocity to test their apps: the `velocity-quick-start` package and the `velocity-example` app.

#### Quick-start

The [`velocity-quick-start`](https://github.com/alanning/meteor-velocity-quick-start) package will add some test frameworks to your app and include sample tests for you.  Here's how you would add it to your app:

```bash
$ cd your-app-dir
$ mrt add velocity-quick-start
$ mrt
```

Check out the sample tests in the `tests` directory and run your app to see the results in both the console and the html-reporter overlay.


#### Example app


```bash
$ cd ~/tmp
$ git clone https://github.com/xolvio/velocity-example.git
$ cd velocity-example
$ mrt
```

You'll see the leaderboard example started on port 3000.

Because the example has included the [velocity-html-reporter](https://github.com/rissem/velocity-html-reporter/) package, you'll see a green dot in the top right that indicates the success or failure of your tests.  If any tests are failing, this will go red.  Clicking the dot will display the report overlay test details.

Try modifying the tests and see them update reactively in the browser.


## Current Frameworks

The `velocity` package coordinates between test frameworks and provides a common structure for getting test results.  Velocity by itself does not perform any tests.  To actually test your app, use one or more of the velocity-compatible test frameworks listed below:

* [mocha-web-velocity](https://github.com/mad-eye/meteor-mocha-web) - A Velocity version of mocha-web.  Runs mocha tests in the Meteor context which is great for integration testing.
* [jasmine-unit](https://github.com/xolvio/jasmine-unit) - Runs jasmine unit tests out of the Meteor context.  Fast and good for smaller unit tests.
* [meteor-cucumber](https://github.com/xdissent/meteor-cucumber) - Velocity-compatible [CucumberJS](https://github.com/cucumber/cucumber-js) runner for Meteor
* [jasmine](https://github.com/Sanjo/meteor-jasmine) - run client tests in the browser within the app context.
* [selenium-nightwatch](https://github.com/awatson1978/selenium-nightwatch/) - run acceptance tests in real browsers using Selenium and Nightwatch


## Current Reporters

* [velocity-html-reporter](https://github.com/rissem/velocity-html-reporter/) - Adds an overlay to your app, green/red dot in top right.  Click dot for test details.



## Test framework authors

We would love to add your framework to the list!  Take a look at how some of these interface with velocity and let us know about your framework on the [velocity-core](https://groups.google.com/forum/#!forum/velocity-core) google group.

A few notes on being velocity-compatible:

#### Sample Tests

Please put some sample tests in a directory named `sample-tests` at the root of your package.  These will be used by the velocity-quick-start package and also allows users to click a button in the html-reporter to have them added to their apps.

#### Debug output

Please include a way to get more detailed info about your test runs.  

One way that we've done it is by having an environment flag that the user can set.  Feel free to use `VELOCITY_DEBUG` if you'd like.  

For example, you could write your logging like this:

    var DEBUG = process.env.VELOCITY_DEBUG;
    DEBUG && console.log('[my-framework] helpful debugging info', someVar);
    

#### Changes to `smart.json`

You'll need to include some velocity-specific fields in your package's smart.json file:  

* `testPackage` [Boolean] - lets velocity know your framework is available to send test files to.  
* `regex` [String] - tells velocity which files in the `tests` directory should go to your framework.  

An example `smart.json` from the `jasmine-unit` test framework:

    {
        "name": "jasmine-unit",
        "description": "Velocity-compatible unit test package with jasmine syntax",
        "homepage": "https://github.com/xolvio/jasmine-unit",
        "author": "Sam Hatoum",
        "version": "0.1.19",
        "git": "https://github.com/xolvio/jasmine-unit.git",
        "testPackage": true,
        "regex": "-jasmine-unit.(js|coffee)$",
        "packages": {
          "velocity": "",
          "package-stubber": ""
        }
    }

Source: https://github.com/xolvio/jasmine-unit/blob/master/smart.json


## Debug output

Sometimes things break and its useful to get more debugging info.  Most of the test frameworks support some kind of debugging environment variable flag.  You can usually see a lot more details about what's happening if you run your app with this command:

```bash
$ DEBUG=1 JASMINE_DEBUG=1 VELOCITY_DEBUG=1 mrt
```


## Troubleshooting

* `Error: There was a problem checking out branch: master`

Used to be encountered when you referenced the velocity repo directly in `smart.json`. Was because we tried using a submodule for the example app but meteorite doesn't play well with submodules.  If you are still running into this one,  see [Issue #37](https://github.com/xolvio/velocity/issues/37) for a fix.


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
