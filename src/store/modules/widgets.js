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
      // console.log("Getting setting for " + id);
      return widget.settings?widget.settings[prop]:state.widgetTypes.find(type=>type.properName === widget.type)[prop].default
    },
    settings: state => id => {
      let widget = state.widgets.find(widget=>widget.id===id)
      // console.log("This one" + JSON.stringify(widget.settings));
      return JSON.parse(JSON.stringify(widget.settings))
    },
    type: state => id => {
      let widget = state.widgets.find(widget=>widget.id===id)
      console.log(widget);
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
      // console.log('load');
      state.widgets = data.widgets//.filter(obj=>obj.id);
      state.loaded = true
      // for (let widget of data.widgets) {
      //   state.widgets[widget.id] = widget;
      // }
    },
    remove(state, {id}) {
      // console.log('remove');
      state.widgets.splice(state.widgets.findIndex(widget=>widget.id === id), 1)
    },
    add(state, {id, type}) {
      // console.log('add');
      let typeInfo = state.widgetTypes.find(typeInfo=>typeInfo.properName===type)
      let settings = {...DEFAULTS}
      for (let setting in typeInfo.settings) {
        settings[setting] = typeInfo.settings[setting].default
      }
      state.widgets.push({id, type, settings});
    },
    updateSetting(state, {id, prop, value}) {
      let widget = state.widgets.find(widget=>{
        // console.log(id, widget);
        return widget.id===id
      })
      // console.log('updateSetting', prop, value)
      if (!widget) return
      if (!widget.settings) widget.settings = {...DEFAULTS}
      Vue.set(widget.settings, prop, value)//[prop] = value
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
