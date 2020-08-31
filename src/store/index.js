import fs from 'fs'
import path from 'path'
import { ipcRenderer } from 'electron'
import Vue from 'vue'
import Vuex from 'vuex'
import widgets from './modules/widgets.js'

Vue.use(Vuex)
let buffering = false;
// let lastSave = 0;
let savePoller = null;
let buffered = 0;
let lastData = null;
function saveBuffered(data) {
  lastData = data;
  if (!buffering) {
    buffering = true;
    buffered = true;
    savePoller = setInterval(()=>{
      if (!buffered) {
        console.log("No new data came in saving");
        fs.promises.writeFile(path.join(ipcRenderer.sendSync('get-user-path'), 'widgets.json'), JSON.stringify(lastData))
        clearInterval(savePoller)
        savePoller = null;
        buffering = false;
      } else {
        console.log("New data came in stalling");
        buffered = false
      }
    }, 1000)
  } else if (buffering) {
    buffered = true;
  }
}

export default new Vuex.Store({
  state: () => ({}),
  mutations: {
  },
  actions: {
  },
  modules: {
    widgets
  },
  plugins: [(store)=>{
    /* eslint-disable no-unused-vars */
    store.subscribe((mutation, state)=>{
      let res = {widgets: state.widgets.widgets};
      // let res = {widgets: []};
      // console.log('saving', res);
      if (state.widgets.loaded) saveBuffered(res);
    })
  }]
})
