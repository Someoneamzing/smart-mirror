<template>
  <div class="home">
    <div class="status-bar">
      <div class='status-group'><mwc-icon class="status-icon">{{wifiConnected?'wifi':'wifi_off'}}</mwc-icon></div>
      <div class='status-group'><span class='status-text'>{{(cpuTemp-(-1)==0 ?"--":cpuTemp) + " &deg;C"}}</span><mwc-icon class="status-icon">memory</mwc-icon></div>
      <div class="status-group" v-if="$store.state.errors > 0">
        <span class="status-text">{{$store.state.errors}}</span>
        <mwc-icon class="status-icon">warning</mwc-icon>
      </div>
    </div>
    <div class="control-bar">
      <div style="position: relative;">
        <mwc-icon-button ref="new-button" icon="add" @click="$refs['new-menu'].show()"/>
        <mwc-menu ref="new-menu" @selected="addNewWidget">
          <mwc-list-item v-for="type in $store.state.widgets.widgetTypes" :key="type.properName" :value="type.properName">{{type.name}}</mwc-list-item>
        </mwc-menu>
      </div>
    </div>
    <Widget v-for="widget in widgets" :id="widget.id" :key="widget.id" />
  </div>
</template>

<script>
// @ is an alias to /src
import Widget from '@/components/Widget';
import {v4 as uuid} from 'uuid';
// import si from 'systeminformation';
import {fork} from 'child_process';

export default {
  name: 'Home',
  components: {
    Widget,
  },
  data() {return {
    wifiConnected: false,
    cpuTemp: -1,
    statusFork: null
  }},
  computed: {
    widgets() {
      let res = this.$store.state.widgets.widgets;
      return res
    }
  },
  methods: {
    addNewWidget(event) {
      this.$store.commit('widgets/add', {id: uuid(), type: event.target.items[event.detail.index].value})
    },
    updateStats(data) {
      this.wifiConnected = data.networkInterfaces.some(int=>int.operstate == 'up')
      this.cpuTemp = data.cpuTemperature.main
    }
  },
  created() {
    this.statusFork = fork('src/api/statusWorker.js', {stdio: 'pipe'})
    this.statusFork.on('message', this.updateStats.bind(this));
    this.statusFork.stdout.on('data', (data) => {
      this.$log("Status Worker: ", data.toString());
    })
    this.statusFork.stderr.on('data', (data) => {
      this.$error("Status Worker: ", data.toString());
    })
    // currentWatcher = this.updateStats;
    // this.updateStats = this.updateStats.bind(this)
    // this.statusInterval = si.observe({
    //   cpuTemperature: 'main',
    //   networkInterfaces: '*',
    // }, 1000, (data)=>{this.updateStats(data)})
  },
  beforeDestroy() {
    this.statusFork.kill();
  },
  mounted() {
    this.$refs['new-menu'].anchor = this.$refs['new-button']
  }
}
</script>

<style media="screen">
  .home {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-template-rows: repeat(auto-fill, minmax(200px, 1fr));
    grid-gap: 1rem;
    width: 100%;
    height: 100%;
  }

  .home::before {
    display: block;
    content: "";
    grid-row: 1 / span 1;
    grid-column: 1 / span 1;
  }

  .control-bar {
    position: fixed;
    top: -50px;
    left: 0;
    width: 100%;
    padding-bottom: 20px;
    z-index: 10;
    transition: top .3s;
  }

  .control-bar:hover {
    top: 0;
  }

  .status-bar {
    position: fixed;
    top: 1px;
    left: 0;
    width: 100vw;
    /* height: 20px; */
    display: flex;
    flex-direction: row-reverse;
    padding-right: 3rem;
    padding-top: .5rem;
  }

  .status-group {
    display: block;
    margin: 0;
    padding: 0;
    padding-left: 1rem;
    display: flex;
    /* vertical-align: middle; */
  }

  .status-text {
    padding-top: .3rem;
  }
</style>
