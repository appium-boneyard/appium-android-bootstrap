## appium-android-bootstrap

[![NPM version](http://img.shields.io/npm/v/appium-android-bootstrap.svg)](https://npmjs.org/package/appium-android-bootstrap)
[![Downloads](http://img.shields.io/npm/dm/appium-android-bootstrap.svg)](https://npmjs.org/package/appium-android-bootstrap)
[![Dependency Status](https://david-dm.org/appium/appium-android-bootstrap/master.svg)](https://david-dm.org/appium/appium-android-bootstrap/master)
[![devDependency Status](https://david-dm.org/appium/appium-android-bootstrap/master/dev-status.svg)](https://david-dm.org/appium/appium-android-bootstrap/master#info=devDependencies)

[![Build Status](https://api.travis-ci.org/appium/appium-android-bootstrap.png?branch=master)](https://travis-ci.org/appium/appium-android-bootstrap)
[![Coverage Status](https://coveralls.io/repos/appium/appium-android-bootstrap/badge.svg?branch=master)](https://coveralls.io/r/appium/appium-android-bootstrap?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/appium/appium-android-bootstrap.svg)](https://greenkeeper.io/)

JavaScript interface, and Java code, for interacting with Android UI Automator. The system allows _ad hoc_ commands to be sent to the device, which are executed using Android's [UIAutomator](http://developer.android.com/tools/testing-support-library/index.html#UIAutomator) testing framework.


### Technical details

The system works by a `com.android.uiautomator.testrunner.UiAutomatorTestCase` placed on the Android device, which opens a [SocketServer](http://docs.oracle.com/javase/7/docs/api/java/net/ServerSocket.html) on port `4724`. This server receives commands, converts them to appropriate Android UI Automator commands, and runs them in the context of the device.

The commands are sent through the JavaScript interface.


### Usage

The module provides an `AndroidBootstrap` class, which is instantiated with an instance of [appium-adb](https://github.com/appium/appium-adb), a system port (defaults to `4724`) and an optional web socket. The object then has four `async` methods:

`async start (appPackage, disableAndroidWatchers)`

Uses Appium's [UI Automator](https://github.com/appium/appium-uiautomator) interface to install the test case, and sets up socket communication.

- `appPackage` - The package name for the application under test (e.g., 'com.example.android.apis').
- `disableAndroidWatchers` - Whether or not to watch Android events. Defaults to `false`.

```js
import AndroidBootstrap from 'appium-android-bootstrap';

let androidBootstrap = new AndroidBootstrap();
await androidBootstrap.start('com.example.android.apis', false);
```


`async shutdown ()`

Shuts down all services. Stops UI Automator process on device, and kills communication.

```js
await androidBootstrap.shutdown();
```


`async sendCommand (type, extra, cmdTimeout)`

Send a command to the device.

- `type` - The type of command being sent. The two valid types are `action` and `shutdown`. These are exported as the enumeration `COMMAND_TYPES`
- `extra` - A hash of extra parameters to send to the device.
- `cmdTimeout` - The amount of time, in `ms`, to wait for the device to respond. Defaults to `10000`.

```js
let dataDir = await androidBootstrap.sendCommand(COMMAND_TYPES.ACTION, {action: 'getDataDir'});
// dataDir === '/data'
```


`async sendAction (action, params)`

Send an `action` command to the device. Equavalent to `sendCommand ('action', {action: action, params: params})`.

- `action` - The action to be sent.
- `params` - Parameters for the action.

```js
let dataDir = await androidBootstrap.sendAction('getDataDir');
// dataDir === '/data'
```


`COMMAND_TYPES`

An enumeration of the available types of commands, to be used for `sendCommand`. The members are `ACTION`, and `SHUTDOWN`.


### Development


#### Building the Bootstrap Jar

This package builds with an older version of the Android tools, using [ant](https://ant.apache.org/).

To build the Java system, make sure [ant](https://ant.apache.org/) is installed.

In order to have both the current Android tools and the ones needed for this package,
do the following:
1. Copy your `$ANDROID_HOME` directory (where the Android SDK is installed) to another location.
1. Download the Android 22 tools
    * MacOS: http://dl-ssl.google.com/android/repository/tools_r22-macosx.zip
    * Linux: http://dl-ssl.google.com/android/repository/tools_r22-linux.zip
    * Windows: http://dl-ssl.google.com/android/repository/tools_r22-windows.zip
1. Replace the `tools` directory in the copied Android SDK directory with the Android 22
  `tools` just downloaded
1. Create/edit `bootstrap/local.properties` file, adding
    * `sdk.dir=/path/to/copied/android/sdk`

Now you should be able to build the Jar file by running
```sh
npm run build:jar
```

#### Watch

```sh
npm run watch
```

#### Test

```sh
npm run test
```

```sh
npm run e2e-test
```
