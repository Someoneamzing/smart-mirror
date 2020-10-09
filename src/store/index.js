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
        fs.promises.writeFile(path.join(ipcRenderer.sendSync('get-user-path'), 'widgets.json'), JSON.stringify(lastData))
        clearInterval(savePoller)
        savePoller = null;
        buffering = false;
      } else {
        buffered = false
      }
    }, 1000)
  } else if (buffering) {
    buffered = true;
  }
}

export default new Vuex.Store({
  state: () => ({errors: 0}),
  mutations: {
    error(state){state.errors += 1}
  },
  actions: {
  },
  modules: {
    widgets
  },
  plugins: [(store)=>{
    /* eslint-disable-next-line no-unused-vars */
    store.subscribe((mutation, state)=>{
      let res = {widgets: state.widgets.widgets};
      if (state.widgets.loaded) saveBuffered(res);
    })
  }]
})
