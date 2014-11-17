Velocity
========

Test runner (and community) for Meteor apps.  Under heavy development.

### What is Velocity?
Head over to the [official homepage](http://velocity.meteor.com) 

Find out more by watching the [Intro to Velocity](http://youtu.be/kwFv1mXrLWE?t=40m51s) talk that
 Robert, Sam, and Mike did at the June 2014 Meteor Devshop!

Read more in the [free chapter on Velocity in The Meteor Testing Manual](www.meteortesting.com/chapter/velocity)

### Getting Started

The Velocity package itself is not something that you include, rather you use Velocity-compatible
framework. 

To see frameworks in action, have a look at the [velocity-examples](https://github.com/meteor-velocity/velocity-examples) repository.
 
### Troubleshooting

Sometimes things break and its useful to get more debugging info.  Most of the test frameworks 
support some kind of debugging environment variable flag.  You can usually see a lot more details
about what's happening if you run your app with this command:

```bash
$ DEBUG=1 JASMINE_DEBUG=1 VELOCITY_DEBUG=1 VELOCITY_DEBUG_MIRROR=1 meteor
```

### Reporting bugs

Please report bugs directly on the issues of the framework(s) you are using. Framework authors 
will then post issues to the core if they are core issues.

##Velocity Compatible Packages

### Frameworks

Below is a list of the currently available frameworks.

####Fully Integrated

These frameworks have an example in the [velocity-examples](https://github
.com/meteor-velocity/velocity-examples) repository. They also include a set of sample tests that 
the framework can add directly to the reporter when you first install the framework. 

* [sanjo:jasmine](https://github.com/Sanjo/meteor-jasmine) - Write client and server unit and integration tests with Jasmine.
* [mike:mocha](https://github.com/mad-eye/meteor-mocha-web) - A Velocity version of mocha-web. Runs mocha tests in the Meteor context which is great for integration testing.
* [xolvio:cucumber](https://github.com/xolvio/meteor-cucumber) - Use Gherkin-syntax cucumber to 
test your app. Integrated nicely with [meteor-webdriver](https://github.com/xolvio/meteor-webdriver)  


####Partially Integrated

These frameworks are very usable, and they are placed under this section as they currently don't 
have an example app and do not offer a sample-test button in the reporter. 

* [clinical:nightwatch](https://github.com/awatson1978/selenium-nightwatch/) - run acceptance tests with automated browsers using the Nightwatch bridge to Selenium
* [nblazer:casperjs](https://github.com/blazer82/meteor-casperjs/) - [CasperJS](http://casperjs.org) end to end test integration 

### Reporters

Reporters display test results.

* [velocity:html-reporter](https://github.com/meteor-velocity/html-reporter/) - Adds an overlay to your app indicating test success/failure (green/red dot in top right).  Click dot for test details.  `meteor add velocity:html-reporter`

### Mirrors

Mirrors are used by test frameworks to run tests within. Tests are typically destructive and as such
require a different database. Mirrors run a parallel version of your app with a different 
database as not to intrude on the main development workflow.

* [node-soft-mirror](https://github.com/meteor-velocity/node-soft-mirror) - This mirror offers an 
extremely fast startup time. It creates a mirror using a node form from within the running meteor 
process.

### Other

* [xolvio:webdriver](https://github.com/xolvio/meteor-webdriver) - Adds webdriver.io to any test 
framework for UI testing. Uses PhantomJS in GhostDriver mode for ultra-fast UI testing

## Test Framework Authors

We would love to add your framework to the list!  Take a look at how some of these interface with velocity and let us know about your framework on the [velocity-core](https://groups.google.com/forum/#!forum/velocity-core) google group.

Please see the [velocity-wiki](https://github.com/meteor-velocity/velocity/wiki/How-to-integrate-a-test-framework-with-Velocity) for basic instructions on making your test framework work with Velocity.

Also, be sure to check out the documentation for the public API.  You can view them in the browser by cloning this repo and then running: `open docs/classes/Velocity.html`
 
A few notes on being velocity-compatible:

### Register testing framework to Velocity

Use `Velocity.registerTestingFramework(frameworkName, options)` to register your package as testing framework. You can find a description of the expected arguments in the docs.


### Sample Tests

Please put some sample tests in a directory named `sample-tests` at the root of your package. 
These will be used by the velocity-quick-start package and also allows users to click a button 
in the html-reporter to have them added to their apps.

### Debug output

Please include a way to get more detailed info about your frameworks' test runs.  

One way that we've done it is by having an environment flag that the user can set.  Feel free to use `VELOCITY_DEBUG` if you'd like.  

For example, you could write your logging like this:

    var DEBUG = process.env.VELOCITY_DEBUG;
    DEBUG && console.log('[my-framework] helpful debugging info', someVar)

### Writing a new Mirror Package

See [instructions here](https://github.com/meteor-velocity/velocity/wiki/How-to-Write-a-Mirror-Package)

## For velocity:core maintainers

### Developing with a local version of velocity:core

1. Clone https://github.com/meteor-velocity/velocity-examples.git
2. Create a symlink to your local velocity:core package:

 ```bash
 cd velocity-examples/leaderboard-jasmine
 mkdir packages
 cd packages
 # Replace ~/velocity with your path 
 ln -s ~/velocity velocity:core
 ```

3. Start the velocity example app. It will use your local velocity:core version.

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

### Meteor Method Naming Convention

We have two naming schemas:

1. When the method does something with a resource type: `velocity/<RESOURCE_NAME>/<ACTION>`
2. When the method isn't specific to a resource type: `velocity/<ACTION>`

All parts a camelCase and start with a lowercase letter.

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

## Roadmap

https://trello.com/b/VCmaj73b/velocity-project

