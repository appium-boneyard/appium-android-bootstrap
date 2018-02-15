"use strict";
const teen_process = require('teen_process');
const system = require('appium-support').system;

const antCmd = system.isWindows() ? 'ant.bat' : 'ant';

const gulp = require('gulp');
const boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp);

gulp.task('ant-clean', function () {
  return teen_process.exec(antCmd, ['clean'], {cwd: 'bootstrap'});
});

gulp.task('ant-build', ['ant-clean'], function () {
  return teen_process.exec(antCmd, ['build'], {cwd: 'bootstrap'});
});

gulp.task('ant', ['ant-clean', 'ant-build']);

boilerplate({
  build: 'appium-android-bootstrap',
  extraPrepublishTasks: ['ant'],
  e2eTest: {android: true},
  testTimeout: 20000
});
