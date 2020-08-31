/* eslint-disable no-unused-vars */
import { ipcRenderer } from 'electron'
import fs from 'fs'
import path from 'path'
import util from 'util'
import Vue from 'vue'
import {v4 as uuid} from 'uuid';

import App from './App.vue'
import store from './store'
import router from './router'
import '../node_modules/material-design-icons/iconfont/material-icons.css'

import MWCIconButton from '@material/mwc-icon-button'
import MWCIcon from '@material/mwc-icon'
import MWCMenu from '@material/mwc-menu'
// import MWCSwitch from '@material/mwc-switch'
import MWCListItem from '@material/mwc-list/mwc-list-item'

Vue.use(new (class {
  install(Vue){
    Vue.prototype.$log = Vue.$log = (...args)=>{
      console.log(...args);
      ipcRenderer.send('alert', {
        type: 'info',
        message: args.map(arg=>{
          return util.inspect(arg, {showProxy: true})
        }).join('\n'),
        timestamp: Date.now(),
        id: uuid()
      })
    }
    Vue.prototype.$warn = Vue.$warn = (...args)=>{
      console.warn(...args);
      ipcRenderer.send('alert', {
        type: 'warn',
        message: args.map(arg=>{
          return util.inspect(arg, {showProxy: true})
        }).join('\n'),
        timestamp: Date.now(),
        id: uuid()
      })
    }
    Vue.prototype.$error = Vue.$error = (...args)=>{
      console.error(...args);
      ipcRenderer.send('alert', {
        type: 'error',
        message: args.map(arg=>{
          return util.inspect(arg, {showProxy: true})
        }).join('\n'),
        timestamp: Date.now(),
        id: uuid()
      })
    }
  }
}))
const widgets = require.context('./components/widgets', false, /\.(vue|js)$/i)
let names = [];
Vue.$log("Registering widgets...")
for (let widgetName of widgets.keys()) {
  Vue.$log(widgetName);
  const widgetComponent = widgets(widgetName)
  const properName = "Widget" + widgetName.split('/').pop().replace(/\.\w+$/, '')
  Vue.component(
    properName,
    widgetComponent.default || widgetComponent
  )
  names.push({properName, ...widgetComponent.widget});
}
Vue.$log("Done!")

store.commit('widgets/registerWidgetTypes', names)

Vue.component('mwc-icon-button', MWCIconButton)
Vue.component('mwc-icon', MWCIcon)
Vue.component('mwc-menu', MWCMenu)
// Vue.component('mwc-switch', MWCSwitch)
Vue.component('mwc-list-item', MWCListItem)

Vue.config.productionTip = false



fs.promises.readFile(path.join(ipcRenderer.sendSync('get-user-path'), 'widgets.json'), 'utf-8').then((data)=>{
  Vue.$log("Loaded saved widget layout.", data);
  if (data) {
    store.commit('widgets/load', JSON.parse(data))
  } else {
    store.commit('widgets/load', {widgets: []})
  }

}).catch((error)=>{
  Vue.$log("There was an error while reading saved widget layouts. Assuming the layout to be missing.", error);
  store.commit('widgets/load', {widgets: []})
})

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
