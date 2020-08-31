import fs from 'fs'
import path from 'path'
import { ipcRenderer } from 'electron'
import { google } from 'googleapis'
import Vue from 'vue'

export const GoogleCalendar = new (class GoogleCalendar {
  constructor(){
    this.state = 'unauthorised';
    this.TOKEN_PATH = path.join(ipcRenderer.sendSync('get-user-path'),'calendar_token.json');
    this.oAuth2Client = null;
    this.SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
  }

  auth() {
    return new Promise((resolve, reject) => {
      Vue.$log("Authenicating with google...");
      fs.readFile('./credentials.json', 'utf-8', (err, content)=>{
        if (err) return reject('Unable to load credentials. ' + err.toString())
        // Vue.$log(content);
        const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
        Vue.$log("Initialising OAuth2Client ...");
        this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        Vue.$log("Checking for existing tokens...");
        fs.readFile(this.TOKEN_PATH, (err, token)=>{
          if (err) {
            Vue.$log("No existing tokens. Fetching new one...");
            const authUrl = this.oAuth2Client.generateAuthUrl({access_type: 'offline', scope: this.SCOPES});
            Vue.$log("Waiting for user to allow access.");
            ipcRenderer.send('open-auth', authUrl)
            ipcRenderer.once('auth-code', (event, code)=>{
              Vue.$log("Recieved auth code. Fetching new token...");
              this.oAuth2Client.getToken(code, (err, token) => {
                if (err) reject('Error retrieving access token ' + err.toString())
                Vue.$log("Got new token. Using it.");
                this.oAuth2Client.setCredentials(token);
                Vue.$log("Authed with new token");
                fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (err)=>{if (err) Vue.$log("Storing token: " + err.toString())})
                resolve()
              })
            })
          } else {
            Vue.$log("Found existing token. Using it.");
            this.oAuth2Client.setCredentials(JSON.parse(token));
            Vue.$log("Authed with existing token.");
            resolve()
          }
        })
      })
    }).then(()=>{
      this.api = google.calendar({version: 'v3', auth: this.oAuth2Client})
    });
  }

  events(opts) {
    return new Promise((resolve, reject) => {
      this.api.events.list(opts, (err, result)=>{
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    });
  }

  calendars(opts) {
    return new Promise((resolve, reject) => {
      this.api.calendarList.list(opts, (err, result)=>{
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    });
  }
})();

export const GoogleTasks = new (class GoogleTasks {
  constructor(){
    this.state = 'unauthorised';
    this.TOKEN_PATH = path.join(ipcRenderer.sendSync('get-user-path'),'task_token.json');
    this.oAuth2Client = null;
    this.SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];
  }

  auth() {
    return new Promise((resolve, reject) => {
      fs.readFile('./credentials.json', 'utf-8', (err, content)=>{
        if (err) return reject('Unable to load credentials. ' + err.toString())
        // Vue.$log(content);
        const {client_secret, client_id, redirect_uris} = JSON.parse(content).installed;
        this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        fs.readFile(this.TOKEN_PATH, (err, token)=>{
          if (err) {
            const authUrl = this.oAuth2Client.generateAuthUrl({access_type: 'offline', scope: this.SCOPES});
            ipcRenderer.send('open-auth', authUrl)
            ipcRenderer.once('auth-code', (event, code)=>{
              // Vue.$log(code);
              this.oAuth2Client.getToken(code, (err, token) => {
                if (err) reject('Error retrieving access token ' + err.toString())
                this.oAuth2Client.setCredentials(token);
                fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (err)=>{if (err) Vue.$log("Storing token: " + err.toString())})
                resolve()
              })
            })
          } else {
            this.oAuth2Client.setCredentials(JSON.parse(token));
            resolve()
          }
        })
      })
    }).then(()=>{
      this.api = google.tasks({version: 'v1', auth: this.oAuth2Client})
    });
  }

  lists(opts) {
    return new Promise((resolve, reject) => {
      this.api.tasklists.list(opts, (err, result)=>{
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    });
  }

  tasks(opts) {
    return new Promise((resolve, reject) => {
      this.api.tasks.list(opts, (err, result)=>{
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    });
  }
})();
