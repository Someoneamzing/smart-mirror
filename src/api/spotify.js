import dotenv from 'dotenv'
// import fs from 'fs'
import '@/api/spotify-player'
// import { VM } from 'vm2'
import path from 'path'
import { ipcRenderer } from 'electron'
import { v4 as uuid } from 'uuid'
dotenv.config()
let readyPromise;

const priv = {
  accessToken: null,
  client_secret: process.env.VUE_APP_SPOTIFY_CLIENT_SECRET,
  client_id: process.env.VUE_APP_SPOTIFY_CLIENT_ID,
  scopes: 'user-read-email user-read-private user-read-playback-state user-modify-playback-state user-read-currently-playing streaming app-remote-control user-read-playback-position user-read-recently-played user-top-read',// web-playback
  token_path: path.join(ipcRenderer.sendSync('get-user-path'),'spotify-refresh.token'),
  auth_state: null,
  access_token: null,
  refresh_token: null,
  redirect_uri: 'smart-mirror-spotify://callback'
}

const SpotifyAPI = new (class Spotify {
  constructor() {
    this.authed = false;
    this.Player = null;
  }

  auth() {
    return new Promise((resolve, reject) => {
      if (this.authed) return resolve();
      //We dont have a refresh token so we need to re-auth
      let spotifyAuthURL = new URL('https://accounts.spotify.com/authorize');
      priv.auth_state = uuid()
      spotifyAuthURL.searchParams.set('client_id', priv.client_id);
      // spotifyAuthURL.searchParams.set('client_secret', priv.client_id);
      spotifyAuthURL.searchParams.set('response_type', 'code');
      spotifyAuthURL.searchParams.set('redirect_uri', priv.redirect_uri);
      spotifyAuthURL.searchParams.set('state', priv.auth_state);
      spotifyAuthURL.searchParams.set('scope', priv.scopes);
      ipcRenderer.once('spotify-auth-response', async (event, {err, state, code})=>{
        if (state === priv.auth_state) {
          if (err) return reject(err)
          let body = new URLSearchParams();
          body.set('grant_type', 'authorization_code');
          body.set('code', code);
          body.set('redirect_uri', priv.redirect_uri);
          body.set('client_id', priv.client_id);
          body.set('client_secret', priv.client_secret);
          let response = await fetch('https://accounts.spotify.com/api/token', {
            method: "POST",
            body,
            headers: {
              "Accept": "application/json",
              // "Content-Type": "application/x-www-form-urlencoded"
            },
          })
          if (response.status === 200) {
            let {access_token, expires_in, refresh_token} = await response.json();
            priv.access_token = access_token;
            this.setRefresh(refresh_token);
            this.refreshAfter(expires_in);
            this.authed = true;
            readyPromise.then(()=>resolve())
            // this.loadSDK().then(()=>{
            // })
          } else {
            reject(new Error(`Error while retrieving access token. ${response.status}: ${response.statusText}.\n${await response.text()}`))
          }

        } else {
          reject(new Error(`Recieved mismatching state for spotify auth. Expected: '${priv.auth_state}', Got: '${state}' This indicates a possible attack. Check to ensure you are on a secure network.`))
        }
      })
      ipcRenderer.send('open-spotify-auth', spotifyAuthURL.href)
    })
  }

  setRefresh(token) {
    priv.refresh_token = token;
    // fs.writeFile(priv.token_path, token, (err)=>{
    //   if (err) {
    //     console.error(err);
    //   }
    // })
  }

  refreshAfter(seconds) {
    setTimeout(async ()=>{
      let body = new URLSearchParams();
      body.set('grant_type', 'refresh_token');
      body.set('refresh_token', priv.refresh_token);
      // body.set('client_id', priv.client_id)
      // body.set('client_secret', priv.client_secret)
      // body.set('redirect_uri', priv.redirect_uri);
      let response = await fetch('https://accounts.spotify.com/api/token', {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": "Basic " + Buffer.from(`${priv.client_id}:${priv.client_secret}`).toString('base64')
        },
        body,
      })
      if (response.status === 200) {
        let {access_token, expires_in} = await response.json();
        priv.access_token = access_token;
        // this.setRefresh(refresh_token);
        this.refreshAfter(expires_in);
      } else {
        throw new Error("Error while refreshing access token. " + await response.text())
      }
    }, seconds * 1000 - 10);
  }

  async request(urlPath, params = {}) {
    let url = new URL(urlPath)
    for (let param in params) {
      url.searchParams.set(param, params[param]);
    }
    let response = await fetch(url.href, {
      // method: 'GET'
      headers: {
        'Authorization': `Bearer ${priv.access_token}`
      }
    })

    if (!response.ok) throw new Error(`${response.status}: ${response.statusText};\n${await response.text()}`)
    return response.status == 204 ? {} : await response.json()
  }

  async currently_playing() {
    return await this.request('https://api.spotify.com/v1/me/player')
  }

  getNewPlayer({name, volume}) {
    return new this.Player({name, volume, getOAuthToken: callback => {
      callback(priv.access_token)
    }})
  }
})
process.on('uncaughtException', (err)=>{
  console.error(err.stack)
})

process.on('unhandledPromiseRejection', (err)=>{
  console.error(err.stack)
})

readyPromise = new Promise((resolve) => {
  window.onSpotifyWebPlaybackSDKReady = ()=>{
    SpotifyAPI.Player = window.Spotify.Player
    resolve()
  }
});

export default SpotifyAPI
