<template lang="html">
  <div class="tasklist">
    <div class="list-select" v-if="loaded">
      <button class="list-select-button" @click="showListSelect = !showListSelect" @blur="showListSelect = false">{{list.title}}<div v-show="showListSelect" class="list-select-list">
        <div class="list-select-option" @click="()=>{setList(listEntry.id)}" v-for="listEntry in lists" :key="listEntry.id">
          {{listEntry.title}}
        </div>
      </div></button>

    </div>
    <div class="task-list" v-if="loaded && tasks.length > 0">
      <div class="task" v-for="task in tasks" :key="task.id">
        <span :class="{'task-summary': true, 'completed': task.status === 'completed'}">{{task.title}}</span>
        <!-- <p class='event-description'>{{event.description}}</p> -->
      </div>
    </div>
    <div v-else-if="loaded" class="event-empty">
      You don't have any tasks
    </div>
    <div v-else class="loading">
      loading
    </div>
  </div>
</template>

<script>
import {widgetSettings} from '@/widgetHelpers'
import {GoogleTasks} from '@/api/google'
export const widget = {
  name: "Tasklist",
  settings: {
    numEvents: {
      name: "Number of Tasks",
      default: 10,
      type: 'number'
    }
  }
}

export default {
  name: "Tasklist",
  props: {
    id: String
  },
  data() {return {
    tasks: [],
    lists: [],
    listId: null,
    loaded: false,
    authed: false,
    refreshing: false,
    refreshInterval: null,
    showListSelect: false,
  }},
  async created() {
    try {
      await GoogleTasks.auth()
      this.authed = true;
      this.loadTaskLists(true)
      this.refreshInterval = setInterval(this.loadTaskLists.bind(this), 1000 * 60)
    } catch (e) {
      this.authed = false;
    }
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval)
    this.refreshInterval = null;
  },
  methods: {
    async setList(listId) {
      this.listId = listId
      this.loadTasks()
    },
    async loadTaskLists(first = false) {
      try {
        let listResponse = await GoogleTasks.lists({})
        this.lists = listResponse.data.items
        if (first) this.listId = this.lists[0].id
        this.loadTasks()
      } catch (e) {
        console.error(e);
      }
    },
    async loadTasks() {
      if (this.refreshing) return;
      this.refreshing = true;
      try {
        let tasksResponse = await GoogleTasks.tasks({ maxResults: this.numEvents, tasklist: this.listId, showCompleted: true, showHidden: true})
        this.tasks = tasksResponse.data.items || []
        this.loaded = true
      } catch (e) {
        console.error(e);
      }
      this.refreshing = false;
    },
  },
  computed: {
    list() {return this.lists.find(list=>list.id===this.listId)},
    ...widgetSettings(Object.keys(widget.settings))
  }
}
</script>

<style lang="css" scoped>
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap');

  .tasklist {
    padding: 2rem;
    font-family: "Open Sans", cursive;
    padding-top: 1rem;
  }

  .task-list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .task {
    padding: .5rem;
    position: relative;
    display: block;
  }

  .task-summary.completed {
    text-decoration: line-through;
    color: #aaa;
  }

  .task-summary {
    display: inline-block;
  }

  .task-date {
    float: right;
    display: inline-block;
  }

  .list-select {
    position: relative;
  }

  .list-select-button {
    display: block;
    width: 100%;
    appearance: none;
    border: none;
    background: none;
    border-bottom: 1px solid white;
    color: white;
    font-size: 1.5rem;
    outline: none;
    margin-top: .83em;
    margin-bottom: .8em;
    text-align: left;
  }

  .list-select-list {
    position: absolute;
    top: 0;
    left: 0;
    background: grey;
    width: 100%;
    cursor: pointer;
    z-index: 30;
  }

  .list-select-option:hover {
    background: lightgrey;
  }

  h2 {
    font-weight: normal;
    border-bottom: 1px solid white;
  }
</style>
