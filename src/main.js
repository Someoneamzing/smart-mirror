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
import MWCMenu from '@material/mwc-menu'
// import MWCSwitch from '@material/mwc-switch'
import MWCListItem from '@material/mwc-list/mwc-list-item'

const widgets = require.context('./components/widgets', false, /\.(vue|js)$/i)
let names = [];
for (let widgetName of widgets.keys()) {
  console.log(widgetName);
  const widgetComponent = widgets(widgetName)
  const properName = "Widget" + widgetName.split('/').pop().replace(/\.\w+$/, '')
  Vue.component(
    properName,
    widgetComponent.default || widgetComponent
  )
  names.push({properName, ...widgetComponent.widget});
}

store.commit('widgets/registerWidgetTypes', names)

Vue.component('mwc-icon-button', MWCIconButton)
Vue.component('mwc-icon', MWCIcon)
Vue.component('mwc-menu', MWCMenu)
// Vue.component('mwc-switch', MWCSwitch)
Vue.component('mwc-list-item', MWCListItem)

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
