/* eslint-disable no-unused-vars */
import { ipcRenderer } from 'electron'
import fs from 'fs'
import path from 'path'
import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import matrialFont from 'material-design-icons/iconfont/material-icons.css'
import MWCIconButton from '@material/mwc-icon-button'
import MWCIcon from '@material/mwc-icon'

Vue.component('mwc-icon-button', MWCIconButton)
Vue.component('mwc-icon', MWCIcon)

Vue.config.productionTip = false


fs.promises.readFile(path.join(ipcRenderer.sendSync('get-user-path'), 'widgets.json'), 'utf-8').then((data)=>{
  console.log("Loaded", data);
  if (data) {
    store.commit('widgets/load', JSON.parse(data))
  } else {
    store.commit('widgets/load', {widgets: []})
  }

}).catch((error)=>{
  console.log(error);
  console.log("Loaded");
  store.commit('widgets/load', {widgets: []})
})

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
