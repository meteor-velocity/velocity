"use strict";

var UNIT_TEST = '-unit.js',
    MOCHA_WEB_TEST = '-mocha-web.js',
    walker = require('async-walker');

walker('test', function (stat) {

    if (stat.isFile) {

        if (stat.path.substr(-UNIT_TEST.length) === UNIT_TEST) {
            console.log(stat.path, 'is a unit test');
        }

        if (filePath.substr(-MOCHA_WEB_TEST.length) === MOCHA_WEB_TEST) {
            console.log(stat.path, 'is a mocha-web test');
        }

    }
    return stat;
});