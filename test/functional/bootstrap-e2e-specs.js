// transpile :mocha

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
import path from 'path';
import AndroidBootstrap from '../../index';
import ADB from 'appium-adb';


chai.should();
chai.use(chaiAsPromised);

describe('Android Bootstrap', function () {
  let adb, androidBootstrap;
  let rootDir = path.resolve(__dirname,
                             process.env.NO_PRECOMPILE ? '../..' : '../../..');
  const apiDemos = path.resolve(rootDir, 'test', 'fixtures', 'ApiDemos-debug.apk');
  const systemPort = 4724;
  before(async () => {
    adb = await ADB.createADB();
    const packageName = 'com.example.android.apis',
          activityName = '.ApiDemos';
    await adb.install(apiDemos);
    await adb.startApp({pkg: packageName,
                        activity: activityName});
    androidBootstrap = new AndroidBootstrap(systemPort);
    await androidBootstrap.start('com.example.android.apis', false);
  });
  after(async ()=> {
    await androidBootstrap.shutdown();
  });
  it("sendAction should work", async () => {
    (await androidBootstrap.sendAction('wake')).should.equal(true);
  });
  it("sendCommand should work", async () => {
   (await androidBootstrap.sendCommand('action', {action: 'getDataDir'})).should
     .equal("/data");
  });
});
