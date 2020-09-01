<template lang="html">
  <VueP5 class='sketch' ref="sketch" @setup="(sketch)=>sketch.createCanvas($refs.sketch.$el.clientWidth, $refs.sketch.$el.clientHeight)" @sketch="(sketch)=>registerSketch(sketch)" :update="updater" />
</template>

<script>
import {VM, VMScript} from 'vm2';
import VueP5 from 'vue-p5'
// import p5 from 'p5'
import { widgetSettings } from '@/widgetHelpers';

const REMOTE_REGEX = /(?:\/\/|\/\*)\s*https:\/\/editor\.p5js\.org\/([\w\d]+)\/present\/((?:[^*/\r\n\s]|\s+[^*/\r\n\s])+)\s*(?:\*\/)?(?:\r?\n|\s)*$/
const EXPORT_SUFFIX = ";\n()=>({setup, draw})"

export const widget = {
  name: "Sketch",
  settings: {
    source: {
      name: "Source",
      type: "string",
      default: "",
      large: true,
    }
  }
}

export default {
  name: "Sketch",
  components: {
    VueP5
  },
  props: {
    id: String
  },
  data(){return {
    cachedProject: {user: "", project: ""},
    cachedSource: "",
    activeVM: null,
    activeScript: null,
    updater: 0
  }},
  computed: {
    ...widgetSettings(Object.keys(widget.settings))
  },
  created() {
    this.$watch('source', ()=>{
      this.updater ++;
    })
  },
  methods: {
    async registerSketch(sketch){
      console.log("Registering Sketch...");
      this.$log(this);
      let match = this.source.match(REMOTE_REGEX)
      let src = this.source;
      try {
        if (match) {
          console.log("Found remote reference. Fetching...");
          let user = encodeURIComponent(match[1]);
          let projectID = match[2].replace(/ /g, '_');
          if (this.cachedProject.user === user && this.cachedProject.project === projectID) {
            // src = this.cachedSource;
            console.log("Sketch was cached. Using that.");
          } else {
            let url  =`https://editor.p5js.org/sketches/${projectID}/assets/sketch.js?cache-bust=${encodeURIComponent(Math.floor(Math.random() * 1000000000))}`;
            console.log(url);
            let response = await fetch(url, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache'
              }
            })
            console.log(response);
            src = await response.text();
            src += EXPORT_SUFFIX
            console.log(src);
            this.cachedProject.user = user;
            this.cachedProject.project = projectID
            this.activeScript = new VMScript(src);
          }
        } else {
          console.log("Using local script");
          let script = src + EXPORT_SUFFIX;
          console.log(script);
          this.activeScript = new VMScript(script)
        }
        console.log("Compiling script...");
        this.activeScript.compile()
      } catch (e) {
        this.$error(e)
      }
      console.log(sketch);
      // sketch.console = {
      //   log: (...args)=>console.log(...args),
      //   warn: (...args)=>console.warn(...args),
      //   error: (...args)=>console.error(...args)
      // };
      delete sketch.draw
      // delete sketch.setup
      let proxy = {};
      // if (current.prototype) current = current.prototype
      for (let prop in sketch) {
        if (prop === 'createCanvas') {proxy[prop] = ()=>{}} else
        proxy[prop] = typeof sketch[prop] == 'function' ? sketch[prop].bind(sketch) : sketch[prop]
      }
      for (let prop in sketch.constructor.prototype) {
        if (prop === 'createCanvas') {proxy[prop] = ()=>{}} else
        proxy[prop] = typeof sketch[prop] == 'function' ? sketch[prop].bind(sketch) : sketch[prop]
      }
      proxy.p5 = sketch.constructor;
      proxy.console = {log: ()=>{},warn: ()=>{},error: ()=>{}};
      this.activeVM = new VM({timeout: 10000, sandbox: proxy, eval: false, wasm: false})
      try {
        console.log("Running sketch...");
        let out = this.activeVM.run(this.activeScript)();
        console.log(out);
        out.setup()
        sketch.draw = ()=>{
          out.draw()
        };
      } catch (e) {
        this.$error(e.toString());
      }
    }
  }
}
</script>

<style lang="css" scoped>
  .sketch {
    width: 100%;
    height: 100%;
  }
</style>
