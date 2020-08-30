<template>
  <div class="widget" :style="{gridColumnEnd: `span ${width}`, gridRowEnd: `span ${height}`, gridRowStart: y, gridColumnStart: x}" @mouseleave="settingsTimeoutHandler" @mouseover="settingsRefreshHandler">
    <div class="widget-content" ref="content" :class="{moving}" :style="{left: (moving?mouse.x - mouseOffset.x + 'px':null), top: (moving?mouse.y - mouseOffset.y + 'px':null), width: (moving?sizeOnDrag.width + 'px':null), height: (moving?sizeOnDrag.height + 'px':null)}" @mousedown="mouseDownHandler" @mouseup="mouseUpHandler" @mousemove="mouseMoveHandler">
      <div class="widget-controls" @mousedown.cancel.prevent="()=>{}" @mouseup.cancel.prevent="()=>{}">
        <mwc-icon-button icon="settings" @click="()=>{settingsOpen = !settingsOpen}" class="settings-button" />
        <mwc-icon-button icon="close" @click="removeWidget" />
      </div>
      <div class="widget-settings" :style="{top: `${settingsOpen?0:-100}%`}">
        <table class="widget-settings-scroll">
          <tr class='widget-setting-row'><td class="setting-label-cell"><label>Width<mwc-icon>swap_horiz</mwc-icon></label></td><td class="setting-value-cell"><input type="number" v-model="width"></td></tr>
          <tr class='widget-setting-row'><td class="setting-label-cell"><label>Height<mwc-icon>swap_vert</mwc-icon></label></td><td class="setting-value-cell"><input type="number" v-model="height"></td></tr>
          <tr class='widget-setting-row' v-for="setting in Object.keys(typeInfo.settings)" :key="setting">
            <td class="setting-label-cell"><label>{{typeInfo.settings[setting].name}}</label></td><td class="setting-value-cell">
              <input v-if="['string','number','boolean'].includes(typeInfo.settings[setting].type)" :type="{'string':'text','number':'number','boolean':'checkbox'}[typeInfo.settings[setting].type]" :checked="$store.getters['widgets/setting'](id, setting)" :value="$store.getters['widgets/setting'](id, setting)" @change="$store.commit('widgets/updateSetting', {id, prop: setting, value: $event.target[typeInfo.settings[setting].type==='boolean'?'checked':'value']})">
              <select :ref="setting + 'select'" v-if="typeInfo.settings[setting].type == 'enum'" @change="(e)=>{$store.commit('widgets/updateSetting', {id, prop: setting, value: e.target.value})}">
                <option :selected="(typeof option == 'string'?option:option.value) == $this[setting]" v-for="option in ( typeof typeInfo.settings[setting].enumerations === 'string' ? enumSettingsCaller(setting) : typeInfo.settings[setting].enumerations)" :key="typeof option == 'string'?option:option.value" :value="typeof option == 'string'?option:option.value">{{typeof option == 'string'?option:option.name}}</option>
              </select>
            </td><!-- <mwc-switch v-else-if="typeInfo.settings[setting].type === 'boolean'" v-model="$data[setting]" /> -->
          </tr>
        </table>
        <!-- <mwc-textfield :outlined="false" label="Width" icon="width" /> -->
        <!-- <mwc-textfield :outlined="false" label="Height" icon="height" /> -->
      </div>
      <!-- <p>{{widgetType}}</p> -->
      <component ref="component" :settings="settings" :is="widgetType" :id="id"></component>
    </div>
  </div>
</template>

<script>
import {widgetSettings} from '@/widgetHelpers'

export default {
  name: 'Widget',
  props: {
    // 'initialState': {type: Object, default: ()=>({})},
    id: String
    // width: {type: Number, default: 1},
    // height: {type: Number, default: 1},
    // x: Number,
    // y: Number,
  },
  data() {return {
    settingsOpen: false,
    settingsTimeout: null,
    moveTimeout: null,
    moving: false,
    mouse: {x: 0, y: 0},
    mouseOffset: {x: 0, y: 0},
    sizeOnDrag: {width: 0, height: 0},
    grid: {width: 0, height: 0},
    selectUnwatchers: []
  }},
  computed: {
    settings() {return this.$store.getters['widgets/settings'](this.id)},
    widgetType() {return this.$store.getters['widgets/type'](this.id)},
    typeInfo() {return this.$store.getters['widgets/typeInfo'](this.id)},
    ...widgetSettings(['x','y','width','height']),
    $this() {return this}
  },
  methods: {
    enumSettingsCaller(setting) {
      return this.$refs['component']?this.$refs['component'][this.typeInfo.settings[setting].enumerations]:[];
    },
    settingsTimeoutHandler() {
      if (this.settingsTimeout !== null) {
        this.settingsTimeout = null;
        clearTimeout(this.settingsTimeout);
      }
      if (!this.settingsOpen) return;
      this.settingsTimeout = setTimeout(()=>{
        if (this.settingsTimeout !== null) {
          this.settingsTimeout = null;
          this.settingsOpen = false;
        }
      }, 10000);
    },
    settingsRefreshHandler() {
      if (this.settingsTimeout !== null) {
        this.settingsTimeout = null;
        clearTimeout(this.settingsTimeout);
      }
    },
    removeWidget() {
      this.$store.commit('widgets/remove', {id: this.id})
    },
    mouseDownHandler(event) {
      if (this.moveTimeout) {
        clearTimeout(this.moveTimeout)
      }
      this.moveTimeout = setTimeout(()=>{
        this.mouse.x = event.clientX
        this.mouse.y = event.clientY
        const rect = this.$el.getBoundingClientRect()
        this.mouseOffset.x = event.clientX - rect.left
        this.mouseOffset.y = event.clientY - rect.top
        this.sizeOnDrag.width = this.$refs.content.clientWidth
        this.sizeOnDrag.height = this.$refs.content.clientHeight
        this.grid.width = (parseFloat(window.getComputedStyle(this.$el.parentElement, ":before").width.slice(0,-2)) + parseFloat(window.getComputedStyle(this.$el.parentElement).getPropertyValue('column-gap').slice(0,-2)));
        this.grid.height = (parseFloat(window.getComputedStyle(this.$el.parentElement, ":before").height.slice(0,-2)) + parseFloat(window.getComputedStyle(this.$el.parentElement).getPropertyValue('row-gap').slice(0,-2)));
        // this.$refs.content.style.width = this.sizeOnDrag.width + "px";
        // this.$refs.content.style.height = this.sizeOnDrag.height + "px";
        this.moving = true
      }, 500);
    },
    mouseUpHandler() {
      if (this.moveTimeout) {
        clearTimeout(this.moveTimeout)
        this.moveTimeout = null;
        this.moving = false;
      }
    },
    mouseMoveHandler(event) {
      if (this.moving) {
        this.mouse.x = event.clientX
        this.mouse.y = event.clientY
        this.x = Math.round((this.mouse.x - this.mouseOffset.x) / this.grid.width) + 1;
        this.y = Math.round((this.mouse.y - this.mouseOffset.y) / this.grid.height) + 1;
        // console.log(this.grid.width, this.grid.height, window.getComputedStyle(this.$el.parentElement, ":before").width.slice(0, -2), window.getComputedStyle(this.$el.parentElement, ":before").height.slice(0, -2));
      }
    }
  },
  mounted() {
    this.$nextTick(()=>{
      for (let setting of Object.keys(this.typeInfo.settings).filter(setting=>this.typeInfo.settings[setting].type === 'enum' && typeof this.typeInfo.settings[setting].enumerations === 'string')) {
        let path = '$refs.component.' + this.typeInfo.settings[setting].enumerations;
        console.log(path);
        console.log(this.$refs.component[this.typeInfo.settings[setting].enumerations]);
        this.selectUnwatchers.push(this.$watch(path, ()=>{
          console.log("Setting changed!!!");
          this.$forceUpdate()
        }))
      }
    })
  },
  beforeDestroy() {
    for (let unwatch of this.selectUnwatchers) {
      unwatch();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .widget,.widget-content {
    border-radius: 1rem;
    color: white;
    position: relative;
    overflow: hidden;
  }

  .widget:hover {
    background: #070707;
  }

  .widget-content {
    height: 100%;
    /* background-color: #111; */
  }

  .widget-content.moving {
    opacity: 0.3;
    position: fixed;
    /* background: red; */
    display: block;
    grid-column: none;
    grid-row: none;
    z-index: 30;
  }

  .widget-controls {
    display: none;
    justify-content: flex-end;
    --mdc-icon-size: 12pt;
    --mdc-icon-button-size: 24pt;
    padding: 0 0;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 20;
  }

  .widget:hover .widget-controls {
    display: flex;
  }

  .widget-settings {
    position: absolute;
    top: -100%;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    background: #222222f5;
    transition: top .3s;
    padding: 1rem;
    padding-top: 2rem;
  }

  .setting-label-cell {
    text-align: right;
  }

  .widget-settings td {
    padding: 5px;
  }

  .widget-settings-scroll {
    /* display: grid; */
    /* grid-template-columns: auto auto; */
    display: block;
    width: 100%;
    max-height: 100%;
    gap: .5rem;
    overflow-y: auto;
  }

  .widget-settings-scroll tr {
    width: 100%;
    /* display: block; */
  }

  .widget-settings-scroll::-webkit-scrollbar {
    width: 5px;
  }

  .widget-settings-scroll::-webkit-scrollbar-track {
    /* background: grey; */
  }

  .widget-settings-scroll::-webkit-scrollbar-thumb {
    background: grey;
    border-radius: 5px;
  }

  .settings-icon {
    z-index: 20;
  }

  .widget-settings input[type="checkbox"] {
    appearance: none;
    background: grey;
    display: block;
    width: 30px;
    height: 18px;
    border-radius: 9px;
    position: relative;
    border: none;
  }

  .widget-settings input[type="checkbox"]::before {
    border-radius: 100%;
    width: 18px;
    height: 18px;
    display: block;
    background: lightgrey;
    position: absolute;
    top: 0px;
    left: 0px;
    content: "";
    transition: left 0.3s;
  }

  .widget-settings input[type="checkbox"]:checked {
    background-color: #5cbbff;
  }

  .widget-settings input[type="checkbox"]:checked::before {
    left: 13px;
    right: 0;
  }


  mwc-icon,label {
    vertical-align: middle;
  }

  label {
    justify-self: end;
  }

  input {
    background: rgba(100%,100%,100%,0.1);
    border: none;
    outline: none;
    justify-self: start;
    border-bottom: 1px solid grey;
    color: white;
  }
</style>
