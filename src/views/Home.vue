<template>
  <div class="home">
    <div class="control-bar">
      <mwc-icon-button icon="add" @click="addNewWidget" />
    </div>
    <Widget v-for="widget in widgets" :id="widget.id" :key="widget.id" />
  </div>
</template>

<script>
// @ is an alias to /src
import Widget from '@/components/Widget';
import {v4 as uuid} from 'uuid';

export default {
  name: 'Home',
  components: {
    Widget,
  },
  computed: {
    widgets() {
      let res = this.$store.state.widgets.widgets;
      console.log(res);
      return res
    }
  },
  methods: {
    addNewWidget() {
      this.$store.commit('widgets/add', {id: uuid()})
    },
  },
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
</style>
