#!/bin/sh

sudo apt-get update
sudo apt-get install nodejs npm

sudo ln -s /usr/bin/nodejs /usr/bin/node

sudo npm install --global gulp-cli
npm install --save-dev gulp
npm install --save-dev gulp-concat
npm install --save-dev gulp-concat-css

gulp
