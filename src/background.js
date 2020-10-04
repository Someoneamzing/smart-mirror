'use strict'

import { ipcMain, app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
import http from 'http'
import socketio from 'socket.io'
const server = http.createServer();
const io = socketio(server, {serveClient: false})
const alerts = [];

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

io.on('connection',(socket)=>{
  socket.emit('alerts', alerts)
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let authDialog
let spotifyAuthDialog

// app.commandLine.appendSwitch('widevine-cdm-path', process.platform === 'win32'?"C:\\Program Files (x86)\\Google\\Chrome\\Application\\84.0.4147.135\\WidevineCdm\\_platform_specific\\win_x64widevinecdm.dll":"");
// app.commandLine.appendSwitch('widevine-cdm-version', '4.10.1679.0')

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
])

function createWindow() {
  // Create the browser window.

  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      plugins: true,
      webSecurity: false,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
    },
    frame: false
  })
  authDialog = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    parent: win,
    modal: true,
    kiosk: true,
    show: false
  })
  spotifyAuthDialog = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: false
    },
    parent: win,
    moadal: true,
    show: false
  })

  authDialog.on('close', (e)=>e.preventDefault())
  spotifyAuthDialog.on('close', (e)=>e.preventDefault())

  protocol.registerHttpProtocol('smart-mirror-spotify', (request, cb)=>{
    let url = new URL(request.url);
    console.log(url.searchParams);
    win.webContents.send('spotify-auth-response', {error: url.searchParams.get('error'), state: url.searchParams.get('state'), code: url.searchParams.get('code')})
    cb({
      statusCode: 200,
      data: "<h1>Authorised</h1>",
    })
    spotifyAuthDialog.hide();
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    authDialog.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '/auth.html')
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

app.allowRendererProcessReuse = false;

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('alert', (event, alert)=>{
  alerts.push(alert);
  io.emit('alerts', [alert]);
})

ipcMain.on('get-user-path', (event)=>{
  event.returnValue = app.getPath('userData')
})

ipcMain.on('open-auth', (event, url)=>{
  authDialog.show()
  authDialog.webContents.send('auth-url', url)
  /* eslint-disable-next-line no-unused-vars */
  ipcMain.once('submit-code', (evt, code)=>{
    event.reply('auth-code', code)
    authDialog.hide()
  })
})

ipcMain.on('open-spotify-auth', (event, url)=>{
  spotifyAuthDialog.loadURL(url)
  spotifyAuthDialog.show()
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

//Theb below has been disabled as Widevine does not support ARM arcitechtures.
// app.on('widevine-ready',async () => {
//   console.log("Widevine ready... Launching");
//   if (isDevelopment && !process.env.IS_TEST) {
//     // Install Vue Devtools
//     try {
//       await installExtension(VUEJS_DEVTOOLS)
//     } catch (e) {
//       console.error('Vue Devtools failed to install:', e.toString())
//     }
//   }
//   createWindow()
// })
app.on('ready', async ()=>{
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

server.listen(process.env.VUE_APP_ALERT_WEBSERVER_PORT, ()=>{
  console.log("Alert server up on port " + process.env.VUE_APP_ALERT_WEBSERVER_PORT);
})
