import Vue from 'vue'
const DEFAULTS = {x: 0, y: 0, width: 1, height: 1}

export default {
  namespaced: true,
  state: () => ({
    widgets: [],
    widgetTypes: [],
    loaded: false
  }),
  getters: {
    setting: state => (id, prop) =>  {
      let widget = state.widgets.find(widget=>widget.id===id)
      return widget.settings?widget.settings[prop]:state.widgetTypes.find(type=>type.properName === widget.type)[prop].default
    },
    settings: state => id => {
      let widget = state.widgets.find(widget=>widget.id===id)
      return JSON.parse(JSON.stringify(widget.settings))
    },
    type: state => id => {
      let widget = state.widgets.find(widget=>widget.id===id)
      return widget.type
    },
    typeInfo: state => id => {
      let widget = state.widgets.find(widget=>widget.id===id)
      let typeInfo = state.widgetTypes.find(type=>type.properName===widget.type)
      return JSON.parse(JSON.stringify(typeInfo))
    }
  },
  mutations: {
    load(state, data) {
      state.widgets = data.widgets
      state.loaded = true
    },
    remove(state, {id}) {
      state.widgets.splice(state.widgets.findIndex(widget=>widget.id === id), 1)
    },
    add(state, {id, type}) {
      let typeInfo = state.widgetTypes.find(typeInfo=>typeInfo.properName===type)
      let settings = {...DEFAULTS}
      for (let setting in typeInfo.settings) {
        settings[setting] = typeInfo.settings[setting].default
      }
      state.widgets.push({id, type, settings});
    },
    updateSetting(state, {id, prop, value}) {
      let widget = state.widgets.find(widget=>{
        return widget.id===id
      })
      if (!widget) return
      if (!widget.settings) widget.settings = {...DEFAULTS}
      Vue.set(widget.settings, prop, value)
    },
    registerWidgetTypes(state, names) {
      for (let name of names) state.widgetTypes.push(name)
    },
  },
  actions: {
  },
  modules: {
  },
}
