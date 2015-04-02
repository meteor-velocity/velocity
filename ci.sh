#!/bin/bash

# Exit on first command that fails
set -e

# Run this script from the root folder of the repository with:
# ./test.sh

echo "Killing node and phantomjs processes"
pkill -9 phantomjs || true
pkill -9 node || true
rm -rf test-app/packages/tests-proxy


echo "Checking JSHint"
jshint .
echo "JSHint checks were successful"

echo "Testing app"

cd test-app
rm -rf .meteor/local

# Temporary until the latest cukes + velocity are released together
rm -rf packages/meteor-cucumber
git clone git@github.com:xolvio/meteor-cucumber.git packages/meteor-cucumber

export JASMINE_CLIENT_UNIT=0
export JASMINE_CLIENT_INTEGRATION=0
export JASMINE_SERVER_UNIT=0
export JASMINE_SERVER_INTEGRATION=1
#export VELOCITY_DEBUG=1

meteor --test --once
