import UiAutomator from 'appium-uiautomator';
import ADB from 'appium-adb';
import log from './logger';
import net from 'net';
import path from 'path';
import _ from 'lodash';
import { errorFromCode } from 'mobile-json-wire-protocol';
import B from 'bluebird';

class AndroidBootstrap {
  constructor (systemPort, webSocket) {
    this.systemPort = systemPort;
    this.webSocket = webSocket;
    this.onUnexpectedShutdown = new B(() => {}).cancellable();
  }

  async start (appPackage, disableAndroidWatchers) {
    try {
      const rootDir = path.resolve(__dirname, '../..'),
            startDetector = (s) => { return /Appium Socket Server Ready/.test(s); },
            bootstrapJar = path.resolve(rootDir, 'bootstrap', 'bin', 'AppiumBootstrap.jar');
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
          if (this.webSocket) {
            this.webSocket.sockets.emit('alert', {message: stdout});
          }
        }
        log.debug(`stdout: ${stdout}`);
        log.debug(`stderr: ${stderr}`);
      });
      // Handle unexpected UiAutomator shutdown
      this.uiAutomator.on(UiAutomator.EVENT_CHANGED, async (msg) => {
        if (msg.state === UiAutomator.STATE_STOPPED) {
          this.uiAutomator = null;
          this.onUnexpectedShutdown.cancel(new Error("UiAUtomator shut down unexpectedly"));
        }
      });
      return new Promise ((resolve, reject) => {
        try {
          this.socketClient = net.connect(this.systemPort);
          this.socketClient.once('connect', () => {
            log.info("Android bootstrap socket is now connected");
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      log.errorAndThrow(`Error occured while starting AndroidBootstrap. Original error: ${e}`);
    }
  }

  async sendCommand (type, extra = {}, cmdTimeout = 10000) {
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
    if (this.uiAutomator) {
      // remove listners so we dont trigger unexpected shutdown
      this.uiAutomator.removeAllListeners(UiAutomator.EVENT_CHANGED);
      if (this.socketClient) {
        await this.sendCommand('shutdown');
      }
      await this.uiAutomator.shutdown();
      this.uiAutomator = null;
    } else {
      log.warn("Cannot shut down Android bootstrap; it has already shut down");
    }
  }

  // this helper function makes unit testing easier.
  async init () {
    this.adb = await ADB.createADB();
    this.uiAutomator = new UiAutomator(this.adb);
  }
}

export default AndroidBootstrap;
