#!/bin/bash

set -e
set -u

git config --global user.email "velocity-robot@xolv.io"
git config --global user.name "Velocity Robot"

rm -rf .build* || true
rm -rf docs || true

branch=$(git rev-parse --abbrev-ref HEAD)

yuidoc .
mv docs /tmp/docs
git remote set-branches --add origin gh-pages
git fetch
git checkout gh-pages
# Remove everything but .git
rm -rf *
mv /tmp/docs/* ./
git add --all .
git commit --message "Update docs [skip ci]"
git push --force origin gh-pages
git checkout $branch
