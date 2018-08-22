// transpile :mocha

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { UiAutomator } from '../..';
import path from 'path';
import ADB from 'appium-adb';


chai.should();
chai.use(chaiAsPromised);

describe('UiAutomator', function () {
  let uiAutomator, adb;
  let rootDir = path.resolve(__dirname, '..', '..',
                             process.env.NO_PRECOMPILE ? '' : '..');
  const bootstrapJar = path.resolve(rootDir, 'test', 'fixtures', 'AppiumBootstrap.jar');
  beforeEach(async function () {
    adb = await ADB.createADB();
    uiAutomator = new UiAutomator(adb);
  });

  it('should start and shutdown uiAutomator', async function () {
    let startDetector = (s) => { return /Appium Socket Server Ready/.test(s); };
    await uiAutomator.start(bootstrapJar, 'io.appium.android.bootstrap.Bootstrap',
                            startDetector, '-e', 'disableAndroidWatchers', true);
    uiAutomator.state.should.eql('online');
    await uiAutomator.shutdown();
    uiAutomator.state.should.eql('stopped');
  });
});
