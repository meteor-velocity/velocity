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


## Roadmap

https://trello.com/b/VCmaj73b/velocity-project

## Installation
```sh
meteor add velocity:core
```

## Usage

The Velocity package itself is not something that you would normally include.  Rather you would include the test framework that you would like to use ([see below](https://github.com/meteor-velocity/velocity/#current-frameworks)) and it will automatically be added for you.


## Current Frameworks

The `velocity` package coordinates between test frameworks and provides a common structure for getting test results.  Velocity by itself does not perform any tests.  To actually test your app, use one or more of the velocity-compatible test frameworks listed below:

* [sanjo:jasmine](https://github.com/Sanjo/meteor-jasmine) - Write client and server unit and integration tests with Jasmine.
* [mike:mocha](https://github.com/mad-eye/meteor-mocha-web) - A Velocity version of mocha-web. Runs mocha tests in the Meteor context which is great for integration testing.
* [clinical:nightwatch](https://github.com/awatson1978/selenium-nightwatch/) - run acceptance tests with automated browsers using the Nightwatch bridge to Selenium


## Current Reporters

Reporters display test results.

* [velocity:html-reporter](https://github.com/meteor-velocity/html-reporter/) - Adds an overlay to your app indicating test success/failure (green/red dot in top right).  Click dot for test details.  `meteor add velocity:html-reporter`


## Test framework authors

We would love to add your framework to the list!  Take a look at how some of these interface with velocity and let us know about your framework on the [velocity-core](https://groups.google.com/forum/#!forum/velocity-core) google group.

Please see the [velocity-wiki](https://github.com/xolvio/velocity/wiki/Making-your-test-framework-work-with-meteor-test-runner) for basic instructions on making your test framework work with Velocity.

Also, be sure to check out the documentation for the public API.  You can view them in the browser by cloning this repo and then running: `open docs/classes/Velocity.html`

 
A few notes on being velocity-compatible:

#### Sample Tests

Please put some sample tests in a directory named `sample-tests` at the root of your package.  These will be used by the velocity-quick-start package and also allows users to click a button in the html-reporter to have them added to their apps.

#### Debug output

Please include a way to get more detailed info about your test runs.  

One way that we've done it is by having an environment flag that the user can set.  Feel free to use `VELOCITY_DEBUG` if you'd like.  

For example, you could write your logging like this:

    var DEBUG = process.env.VELOCITY_DEBUG;
    DEBUG && console.log('[my-framework] helpful debugging info', someVar);
    

#### Register testing framework to Velocity

Use `Velocity.registerTestingFramework(frameworkName, options)` to register your package as testing framework. You can find a description of the expected arguments in the docs.

## Disable mirror

Sometimes you just don't what that mirror to start up, maybe the frameworks you have don't need it or you're developing a framework of your own. This is how:

```bash
$ NO_MIRROR=1 meteor
```

## Debug output

Sometimes things break and its useful to get more debugging info.  Most of the test frameworks support some kind of debugging environment variable flag.  You can usually see a lot more details about what's happening if you run your app with this command:

```bash
$ DEBUG=1 JASMINE_DEBUG=1 VELOCITY_DEBUG=1 VELOCITY_DEBUG_MIRROR=1 meteor
```


## Troubleshooting

* `Error: There was a problem checking out branch: master`

Used to be encountered when you referenced the velocity repo directly in `smart.json`. Was because we tried using a submodule for the example app but meteorite doesn't play well with submodules.  If you are still running into this one,  see [Issue #37](https://github.com/xolvio/velocity/issues/37) for a fix.

## For velocity:core maintainers

### Developing with a local version of velocity:core

1. Clone https://github.com/meteor-velocity/velocity-example
2. Create a symlink to your local velocity:core package:

 ```bash
 cd velocity-example
 mkdir packages
 cd packages
 # Replace ~/velocity with your path 
 ln -s ~/velocity velocity:core
 ```

3. Start the velocity-example. It will use your local velocity:core version.

 ```bash
 cd ..
 meteor
 ```

### Publishing to Meteor Package System

1. Make code changes
2. Commit changes
3. Update History.md with summary of changes
4. Bump version numbers in package.js, History.md and yuidoc.json
5. Execute `yuidoc` command from velocity root path
6. Commit changes
7. `meteor publish`
8. Tag last commit with the new version `X.X.X`
9. Push to github. Also push the new tag! (`git push --tags`)


We have to publish velocity:core for the different architectures (Mac OS, 64-bit Linux and 32-bit Linux).

First publish velocity:core on your development machine with `meteor publish`. Then you will need machines with the other two architectures. Use `meteor publish-for-arch velocity:core@VERSION --release 0.9.4` on a computer with the right architecture. Also see [Meteor docs](http://docs.meteor.com/#meteorpublishforarch).


##Contributors

We are collaborating with an all-star team on unifying the Meteor testing landscape:

* [Sam Hatoum](https://github.com/samhatoum) from [Xolv.io](http://xolv.io/), author of [The Meteor Testing Manual](https://www.meteortesting.com)
* [Adrian Lanning](https://github.com/alanning) from [Share911](http://about.share911.com/), contributor to [all things Meteor](https://github.com/alanning?tab=repositories)
* [Mike Risse](https://github.com/rissem) from [MadEye](https://madeye.io/), author of [mocha-web](https://github.com/mad-eye/meteor-mocha-web)
* [Ronen Babayoff](https://github.com/ronen-lavaina) from LaVaina Inc, co-author of [Munit](https://github.com/spacejamio/meteor-munit)
* [Abigail Watson](https://github.com/awatson1978) from [Pentasyllabic](http://www.pentasyllabic.com), author of [Meteor Cookbook](https://github.com/awatson1978/meteor-cookbook), [Selenium-Nightwatch](https://github.com/awatson1978/selenium-nightwatch/)
* [Robert Dickert](https://github.com/rdickert) from [Meteor Boulder](http://www.meetup.com/Meteor-Boulder), contributor to [all things Meteor](https://github.com/rdickert?tab=repositories)
* [Josh Owens](https://github.com/queso) from [Differential](http://differential.io/), author of [Testing with Meteor](http://testingmeteor.com/)
* [Jonas Aschenbrenner](https://github.com/sanjo), velocity contributor, [Jasmine](https://github.com/Sanjo/meteor-jasmine) package

Please join our discussions at the [velocity-core](https://groups.google.com/forum/#!forum/velocity-core) google group.
