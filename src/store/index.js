import fs from 'fs'
import path from 'path'
import { ipcRenderer } from 'electron'
import Vue from 'vue'
import Vuex from 'vuex'
import widgets from './modules/widgets.js'

Vue.use(Vuex)

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
      if (state.widgets.loaded) fs.promises.writeFile(path.join(ipcRenderer.sendSync('get-user-path'), 'widgets.json'), JSON.stringify(res))
    })
  }]
})
