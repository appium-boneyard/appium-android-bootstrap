"use strict";
var teen_process = require('teen_process');

var gulp = require('gulp'),
    boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp);

gulp.task('maven-clean', function () {
  return teen_process.exec('mvn', ['clean'], {cwd: 'bootstrap'});
});

gulp.task('maven-install', ['maven-clean'], function () {
  return teen_process.exec('mvn', ['install'], {cwd: 'bootstrap'});
});

gulp.task('maven', ['maven-clean', 'maven-install']);

boilerplate({
  build: 'appium-android-bootstrap',
  jscs: false,
  extraPrepublishTasks: ['maven']
});
