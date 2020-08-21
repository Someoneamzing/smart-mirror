import Vue from 'vue'
const DEFAULTS = {x: 0, y: 0, width: 1, height: 1}

export default {
  namespaced: true,
  state: () => ({
    widgets: [],
  }),
  getters: {
    setting: state => (id, prop) =>  {
      let widget = state.widgets.find(widget=>widget.id===id)
      return widget.settings?widget.settings[prop]:DEFAULTS[prop]
    },
  },
  mutations: {
    load(state, data) {
      // console.log('load');
      state.widgets = data.widgets.filter(obj=>obj.id);
      // for (let widget of data.widgets) {
      //   state.widgets[widget.id] = widget;
      // }
    },
    remove(state, {id}) {
      // console.log('remove');
      state.widgets.splice(state.widgets.findIndex(widget=>widget.id === id), 1)
    },
    add(state, {id}) {
      // console.log('add');
      state.widgets.push({id, settings: {}});
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
  },
  actions: {
  },
  modules: {
  },
}
