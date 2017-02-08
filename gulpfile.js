"use strict";
var teen_process = require('teen_process');
var system = require('appium-support').system;

var antCmd = system.isWindows() ? 'ant.bat' : 'ant';

var gulp = require('gulp'),
    boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp);

gulp.task('ant-clean', function () {
  return teen_process.exec(antCmd, ['clean'], {cwd: 'bootstrap'});
});

gulp.task('ant-build', ['ant-clean'], function () {
  return teen_process.exec(antCmd, ['build'], {cwd: 'bootstrap'});
});

gulp.task('ant', ['ant-clean', 'ant-build']);

boilerplate({
  build: 'appium-android-bootstrap',
  jscs: false,
  extraPrepublishTasks: ['ant'],
  e2eTest: {android: true},
  testTimeout: 20000
});
