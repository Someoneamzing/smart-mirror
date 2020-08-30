export function widgetSettings(props) {
  let res = {};
  for (let prop of props) {
    res[prop] = {
      get: function (){
        return this.$store.getters['widgets/setting'](this.id, prop);
      },
      set: function (value) {
        this.$store.commit('widgets/updateSetting', {id: this.id, prop, value})
      }
    }
  }
  return res;
}
