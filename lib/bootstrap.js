import UiAutomator from 'appium-uiautomator';
import ADB from 'appium-adb';
import log from './logger';
import net from 'net';
import path from 'path';
import _ from 'lodash';
import { errorFromCode } from 'mobile-json-wire-protocol';

class AndroidBootstrap {
  constructor (systemPort, webSocket) {
    this.systemPort = systemPort;
    this.webSocket = webSocket;
  }

  async start (appPackage, disableAndroidWatchers) {
    try {
      let rootDir = path.resolve(__dirname, '../..');
      let startDetector = (s) => { return /Appium Socket Server Ready/.test(s); };
      const bootstrapJar = path.resolve(rootDir, 'bootstrap', 'bin', 'AppiumBootstrap.jar');
      await this.init();
      this.adb.forwardPort(this.systemPort, this.systemPort);
      this.process = await this.uiAutomator.start(
                       bootstrapJar, 'io.appium.android.bootstrap.Bootstrap',
                       startDetector, '-e', 'pkg', appPackage, '-e',
                       'disableAndroidWatchers', disableAndroidWatchers);
      this.process.on('output', (stdout, stderr) => {
        const alertRe = /Emitting system alert message/;
        if (alertRe.test(stdout)) {
          log.debug("Emitting alert message...");
          this.webSocket.sockets.emit('alert', {message: stdout});
        }
        log.debug(`stdout: ${stdout}`);
        log.debug(`stderr: ${stderr}`);
      });

      this.socketClient = net.connect(this.systemPort, () => {
        log.info("Android bootstrap socket is now connected");
      });
    } catch (e) {
      log.errorAndThrow(`Error occured while starting AndroidBootstrap. Original error: ${e}`);
    }
  }

  sendCommand (type, extra = {}, cmdTimeout = 10000) {
    return new Promise ((resolve, reject) => {
      if (this.socketClient) {
        setTimeout(() => {
          reject(new Error(`Bootstrap server did not respond in ${cmdTimeout} ms`));
        }, cmdTimeout);
        let cmd = {cmd: type};
        cmd = Object.assign(cmd, extra);
        let cmdJson = `${JSON.stringify(cmd)} \n`;
        log.debug(`Sending command to android: ${_.trunc(cmdJson, 1000)}`);
        this.socketClient.write(cmdJson);
        this.socketClient.setEncoding('utf8');
        let streamData = '';
        this.socketClient.on('data', (data) => {
          log.debug("Received command result from bootstrap");
          try {
            streamData = JSON.parse(streamData + data);
            if (streamData.status === 0) {
              resolve(streamData.value);
            }
            reject(errorFromCode(streamData.status));
          } catch (e) {
            log.info("Stream still not complete, waiting");
            streamData += data;
          }
        });
      } else {
        reject(new Error("Socket connection closed unexpectedly"));
      }
    });
  }

  async sendAction (action, params = {}) {
    let extra = {action, params};
    return this.sendCommand('action', extra);
  }

  async shutdown () {
    if (this.socketClient) {
      await this.sendCommand('shutdown');
    }
    await this.uiAutomator.shutdown();
  }

  // this helper function makes unit testing easier.
  async init () {
    this.adb = await ADB.createADB();
    this.uiAutomator = new UiAutomator(this.adb);
  }
}

export default AndroidBootstrap;
