<template lang="html">
  <div class="calendar">
    <template v-if="displayStyle === 'summary'">
      <h2>Calendar</h2>
      <div class="event-list" v-if="loaded && events.length > 0">
        <div class="event" v-for="event in events" :key="event.id">
          <span class="event-summary">{{event.summary}}</span><span class="event-date">{{getEventDate(event)}}</span>
          <!-- <p class='event-description'>{{event.description}}</p> -->
        </div>
      </div>
      <div v-else-if="loaded" class="event-empty">
        You don't have any upcoming events
      </div>
      <div v-else class="loading">
        loading
      </div>
    </template>
    <template v-if="displayStyle === 'monthly'">
      <h2>{{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][today.getMonth()]}}</h2>
      <div class="month-grid">
        <div class="month-weekday" v-for="day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']" :key="day">
          {{day}}
        </div>
        <div class="month-date" v-for="i in Array.from({length: 5 * 7}).map((a,b)=>b)" :key="i">
          <div :class="{'date-info': true, 'today': (today.getDate() === indexToDate(i))}" v-if="monthEndI < monthStartI ? (i <= monthEndI || i >= monthStartI) : (i <= monthEndI && i >= monthStartI)">
            <span class='date-number'>{{indexToDate(i)}}</span>
            <div class="date-event-list" v-if="eventsByDate.has(getDateYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), indexToDate(i))))">
              <div class="date-event" v-for="event in Array.from(eventsByDate.get(getDateYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), indexToDate(i)))).values()).slice(0, 3)" :key="event.id">
                {{event.summary}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import {widgetSettings} from '@/widgetHelpers'
import {GoogleCalendar} from '@/api/google'
export const widget = {
  name: "Calendar",
  settings: {
    numEvents: {
      name: "Number of Events",
      default: 10,
      type: 'number'
    },
    calendar: {
      type: 'enum',
      name: 'Calendar',
      enumerations: 'calendarSelect',
      default: 'primary'
    },
    displayStyle: {
      type: 'enum',
      name: 'Display Style',
      enumerations: [{name: 'Summary', value: 'summary'},{name: 'Monthly', value: 'monthly'}],
      default: 'summary'
    }
  }
}

export default {
  name: "Calendar",
  props: {
    id: String
  },
  data() {return {
    events: [],
    loaded: false,
    authed: false,
    refreshing: false,
    refreshInterval: null,
    calendars: [],
    calendarSelect: [],
    calendarWatcher: null,
    today: new Date(),
    dayTimeout: null,
    regularDay: false,
    startTime: Date.now(),
  }},
  async created() {
    this.dayTimeout = setTimeout(()=>{
      this.today = new Date();
      this.regularDay = true;
      setInterval(()=>{
        this.today = new Date();
      }, 24 * 60 * 60 * 1000)
    }, this.msToMidnight() + 1000)
    try {
      await GoogleCalendar.auth()
      this.authed = true;
      this.loadData()
      this.refreshInterval = setInterval(this.loadData.bind(this), 1000 * 60)
      this.calendarWatcher = this.$watch('calendar', this.loadEvents)
    } catch (e) {
      this.authed = false;
      console.error(e);
    }
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval)
    this.refreshInterval = null;
    this.calendarWatcher();
    if (this.regularDay) {
      clearInterval(this.dayTimeout)
    } else {
      clearTimeout(this.datTimeout)
    }
  },
  methods: {
    async loadEvents() {
      try {
        this.events = (await GoogleCalendar.events({calendarId:this.calendar, timeMin: this.displayStyle === "monthly"?new Date(this.today.getFullYear(), this.today.getMonth(), 1, 0, 0, 0).toISOString():(new Date()).toISOString(), timeMax: this.displayStyle === "monthly"?new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0, 23, 59, 59).toISOString():(new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)).toISOString(), maxResults: this.numEvents, singleEvents: true, orderBy: 'startTime'})).data.items
      } catch (e) {
        console.error(e);
      }
    },
    async loadCalendars() {
      try {
        this.calendars = (await GoogleCalendar.calendars({})).data.items
        this.calendarSelect = this.calendars.map(cal=>({value: cal.id, name: cal.summary})).concat([{value: 'primary', name: 'Primary'}])
      } catch (e) {
        console.error(e);
      }
    },
    async loadData() {
      if (this.refreshing) return;
      this.refreshing = true;
      await Promise.all([this.loadEvents(), this.loadCalendars()])
      this.loaded = true
      this.refreshing = false;
    },
    indexToDate(i) {
      if (this.monthEndI < this.monthStartI && i <= this.monthEndI) {
        return this.daysThisMonth - (this.monthEndI - i);
      } else {
        return i - this.monthStartI + 1;
      }
    },
    getEventDate(event) {
      let today = this.today;
      let date = new Date(event.start.dateTime || event.start.date);
      if (today.toDateString() === date.toDateString() || today > date) {
        let dif = date - today
        if (dif < -60 * 1000) {
          let endDate = new Date(event.end.dateTime || event.end.date);
          dif = endDate - today;
          let timeLeft = "";
          if (today.toDateString() === endDate.toDateString()) {
            if (dif < 60 * 60 * 1000) {
              timeLeft = `in ${Math.floor(dif / (60 * 1000))} minutes`
            } else {
              timeLeft = `in ${Math.floor(dif / (60 * 60 * 1000))} hours`
            }
          } else if ( today.getFullYear() === endDate.getFullYear() &&
                      today.getMonth() === endDate.getMonth() &&
                      today.getDate() + 1 === endDate.getDate()) {
            timeLeft = 'tomorrow'
          } else {
            timeLeft = 'on ' + endDate.toDateString();
          }

          return `Ends ${timeLeft}`
        } else if (dif <= 0) {
          return "Now"
        } else if (dif < 60 * 60 * 1000) {
          return `in ${Math.floor(dif / (60 * 1000))} minutes`
        } else {
          return `in ${Math.floor(dif / (60 * 60 * 1000))} hours`
        }
      } else if ( today.getFullYear() === date.getFullYear() &&
                  today.getMonth() === date.getMonth() &&
                  today.getDate() + 1 === date.getDate()) {
        return "Tomorrow"
      }
      return date.toDateString()
    },
    msToMidnight() {
      let now = new Date();
      let mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
      return mid.getTime() - now.getTime();
    },
    getDateYYYYMMDD(date) {
      return `${date.getFullYear()}-${("" + (date.getMonth() + 1)).padStart('0',2)}-${("" + date.getDate()).padStart('0',2)}`
    }
  },
  computed: {
    // calendarSelect() {
    //   return this.loaded?:[];
    // },
    eventsByDate() {
      let res = this.events.reduce((dates, event)=>{
        let startSpecific = new Date(event.start.dateTime || event.start.date);
        let endSpecific = new Date(event.end.dateTime || event.end.date);
        let date = new Date(startSpecific.getFullYear(), startSpecific.getMonth(), startSpecific.getDate(), 0,0,0);
        while (date <= endSpecific) {
          let dateString = this.getDateYYYYMMDD(date);
          if (!dates.has(dateString)) dates.set(dateString, new Set())
          dates.get(dateString).add(event)
          date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
        return dates
      }, new Map())
      for (let dateString of res.keys()) {
        res.set(dateString, new Set([...res.get(dateString)].sort((a, b)=>{
          let aStart = new Date(a.start.dateTime || a.start.date);
          let bStart = new Date(b.start.dateTime || b.start.date);
          if (aStart < bStart) {
            return -1;
          } else if (aStart > bStart) {
            return 1;
          } else {
            let aEnd = new Date(a.end.dateTime || a.end.date);
            let bEnd = new Date(b.end.dateTime || b.end.date);
            if (aEnd > bEnd) {
              return -1
            } else if (aEnd < bEnd) {
              return 1
            }
            return 0;
          }
        })))
      }
      return res;
    },
    monthStartI() {
      return (new Date(this.today.getFullYear(), this.today.getMonth()).getDay() + 6) % 7
    },
    monthEndI() {
      return (this.monthStartI + this.daysThisMonth - 1) % (5 * 7)
    },
    daysThisMonth() {
      return new Date(this.today.getFullYear(), this.today.getMonth(), 0).getDate();
    },
    ...widgetSettings(Object.keys(widget.settings))
  }
}
</script>

<style lang="css" scoped>
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap');

  .calendar {
    padding: 2rem;
    padding-top: 1rem;
    font-family: "Open Sans", cursive;
    height: 100%;
  }

  .month-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: 2rem repeat(5, 1fr);
    height: calc(100% - 5rem);
    gap: 8px;
  }

  .date-info {
    width: 100%;
    /* margin: 0 auto 10px auto; */
    height: 100%;
    border-bottom: 2px solid white;
    padding: .5rem;
  }

  .date-event-list {
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-rows: repeat(auto-fill, 20px);
    max-height: 100%;
    overflow-y: hidden;
  }

  .date-event {
    font-size: .6rem;
    border-bottom: 1px solid white;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  .date-info.today {
    background: rgba(255,255,255,0.2);
  }

  .event-list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .event {
    padding: .5rem;
    position: relative;
    display: block;
  }

  .event-summary {
    display: inline-block;
  }

  .event-date {
    float: right;
    display: inline-block;
  }

  h2 {
    font-weight: normal;
    border-bottom: 1px solid white;
  }
</style>
