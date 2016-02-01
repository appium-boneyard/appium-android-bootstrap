// transpile :mocha

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { AndroidBootstrap, COMMAND_TYPES } from '../..';
import ADB from 'appium-adb';
import { errors } from 'mobile-json-wire-protocol';


chai.should();
chai.use(chaiAsPromised);

describe('Android Bootstrap', function () {
  this.timeout(60000);
  let adb, androidBootstrap;
  let rootDir = path.resolve(__dirname,
                             process.env.NO_PRECOMPILE ? '../..' : '../../..');
  const apiDemos = path.resolve(rootDir, 'test', 'fixtures', 'ApiDemos-debug.apk');
  const systemPort = 4724;
  before(async () => {
    adb = await ADB.createADB();
    const packageName = 'io.appium.android.apis',
          activityName = '.ApiDemos';
    await adb.install(apiDemos);
    await adb.startApp({pkg: packageName,
                        activity: activityName});
    androidBootstrap = new AndroidBootstrap(adb, systemPort);
    await androidBootstrap.start('io.appium.android.apis', false);
  });
  after(async ()=> {
    await androidBootstrap.shutdown();
  });
  it("sendAction should work", async () => {
    (await androidBootstrap.sendAction('wake')).should.equal(true);
  });
  it("sendCommand should work", async () => {
   (await androidBootstrap.sendCommand(COMMAND_TYPES.ACTION, {action: 'getDataDir'})).should
     .equal("/data");
  });
  it("sendCommand should correctly throw error", async () => {
   await androidBootstrap.sendCommand(COMMAND_TYPES.ACTION, {action: 'unknown'}).should
     .eventually.be.rejectedWith(errors.UnknownCommandError);
  });
  it("should cancel onUnexpectedShutdown promise on unexpected uiAutomator shutdown", async () => {
    await androidBootstrap.sendCommand(COMMAND_TYPES.SHUTDOWN);
    await androidBootstrap.onUnexpectedShutdown.should.eventually
      .be.rejectedWith("Error: UiAUtomator shut down unexpectedly");
  });
});
