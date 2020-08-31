<template lang="html">
  <div class="clock">
    <template v-if="analog">
      <canvas ref="canvas"></canvas>
    </template>
    <template v-if="!analog">
      <h1>{{`${settingHours}:${getDoubleDigit(minutes)}:${getDoubleDigit(seconds)}`}}</h1><h3 v-if="!is24Hour">{{amPm}}</h3>
      <h4>{{dateString}}</h4>
    </template>
  </div>
</template>

<script>
import {widgetSettings} from '@/widgetHelpers'
export const widget = {
  name: "Clock",
  settings: {
    is24Hour: {
      name: "24 Hour",
      default: false,
      type: 'boolean'
    },
    displayType: {
      name: "Display Type",
      type: 'enum',
      enumerations: [{value: "digital", name: "Digital"},{value: "analogClean",name: "Clean Analog"},{value: "analogNumbers", name: "Numbered Analog"}],
      default: 'digital'
    }
    // analog: {
    //   name: "Analog Display",
    //   default: false,
    //   type: "boolean"
    // },
    // showAnalogNumbers: {
    //   name: "Show Numbers",
    //   default: true,
    //   type: "boolean"
    // }
  }
}

export default {
  name: "Clock",
  props: {
    id: String
  },
  methods: {
    getDoubleDigit(x) {
      return String(x).length > 1 ? x : "0" + x;
    },
    update() {
      const date = new Date();
      this.hours = Number(date.getHours());
      this.minutes = date.getMinutes();
      this.seconds = date.getSeconds();
      this.amPm = this.hours > 11?"PM":"AM"
      this.dateString = date.toDateString()
      this.$log(`Time is ${this.hours}:${this.minutes}:${this.seconds}`)
      if (this.analog) {
        let canvas = this.$refs['canvas'];
        let ctx = canvas.getContext('2d');
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        let w2 = canvas.width/2;
        let h2 = canvas.height/2;
        let hourAngle = Math.PI * 2 / 12 * this.hours - Math.PI * .5
        let minuteAngle = Math.PI * 2 / 60 * this.minutes - Math.PI * .5
        let secondAngle = Math.PI * 2 / 60 * this.seconds - Math.PI * .5
        let handMaxLength = Math.min(w2, h2) - 10;
        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'white'
        ctx.lineCap = 'round'
        ctx.lineWidth = 2;
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.save()
        ctx.translate(w2, h2);
        ctx.font = "24pt Unica One"
        if (this.displayType == "analogNumbers") {
          ctx.fillText('12', 0, -handMaxLength * 0.9)
          ctx.fillText('3', handMaxLength * 0.9, 0)
          ctx.fillText('6', 0, handMaxLength * 0.9)
          ctx.fillText('9', -handMaxLength * 0.9, 0)
        }
        ctx.beginPath()
        ctx.arc(0,0,handMaxLength,0,2 * Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.lineWidth = 2
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(secondAngle) * (handMaxLength * .9), Math.sin(secondAngle) * (handMaxLength * .9));
        ctx.stroke()
        ctx.beginPath()
        ctx.lineWidth = 4
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(minuteAngle) * handMaxLength * .7, Math.sin(minuteAngle) * handMaxLength * .7);
        ctx.stroke()
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(hourAngle) * handMaxLength * .5, Math.sin(hourAngle) * handMaxLength * .5);
        ctx.stroke()
        ctx.restore();
      }
    }
  },
  data(){return{
    hours: 0,
    minutes: 0,
    seconds: 0,
    amPm: "AM",
    interval: null,
    dateString: ''
  }},
  computed: {
    analog() {
      return this.displayType.startsWith('analog')
    },
    settingHours() {
      return this.getDoubleDigit((this.is24Hour?this.hours:(this.hours > 12?this.hours - 12:this.hours)));
    },
    ...widgetSettings(Object.keys(widget.settings))
  },
  created() {
    this.interval = setInterval(()=>{
      this.update()
    }, 1000)
  },
  beforeDestroy() {
    clearInterval(this.interval)
    this.interval = null;
  },
  mounted() {
    this.update()
  }
}
</script>

<style lang="css" scoped>
  @import url('https://fonts.googleapis.com/css2?family=Unica+One&display=swap');

  .clock {
    padding: 2rem;
    text-align: center;
    width: 100%;
    height: 100%;
  }

  h1 {
    display: inline;
    font-size: 6rem;
    font-weight: normal;
    height: 100%;
    margin: 0;
    line-height: 1;
    font-family: 'Unica One', cursive;
    letter-spacing: -.3rem;
  }

  h3 {
    display: inline;
    padding-left: 1rem;
  }

  h4 {
    margin: 0;
    text-align: center;
  }

  canvas {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
</style>
