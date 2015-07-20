// transpile :mocha

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
import AndroidBootstrap from '../../index';
import ADB from 'appium-adb';
import { withSandbox } from 'appium-test-support';
import events from 'events';
import UiAutomator from 'appium-uiautomator';
import net from 'net';

chai.should();
chai.use(chaiAsPromised);

describe('AndroidBootstrap', function () {
  const systemPort = 4724;
  let androidBootstrap = new AndroidBootstrap(systemPort),
      adb= new ADB(),
      uiAutomator = new UiAutomator(adb);

  describe("start", withSandbox({mocks: {adb, uiAutomator, net, androidBootstrap}}, (S) => {
    it("should return a subProcess", async function () {
      let conn = new events.EventEmitter();
      conn.start = () => { };
      const appPackage = 'com.example.android.apis',
            disableAndroidWatchers = false;
      androidBootstrap.adb = adb;
      androidBootstrap.uiAutomator = uiAutomator;
      S.mocks.androidBootstrap.expects('createUiAutomator').once()
        .returns('');
      S.mocks.adb.expects('forwardPort').once()
        .withExactArgs(systemPort, systemPort)
        .returns('');
      S.mocks.uiAutomator.expects("start")
        .once()
        .returns(conn);
      S.mocks.net.expects('connect').once().returns(conn);
      await androidBootstrap.start(appPackage, disableAndroidWatchers);
      S.verify();
    });
  }));
});
