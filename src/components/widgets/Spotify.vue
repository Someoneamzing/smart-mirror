<template lang="html">
  <div class="spotify" :style="{justifyContent: {'top': 'flex-start', 'middle': 'center', 'bottom': 'flex-end'}[align]}">
    <div class="player">
      <img :src="track_art !== ''?track_art:MISSING_ALBUM_ART" alt="" class="album-art">
      <div class="player-info">
        <img src="@/assets/Spotify_Icon_RGB_White.png" alt="" class="spotify-logo">
        <span class="now-playing-title">Now Playing:</span>
        <span class="now-playing">{{current_track?`${current_track.name} - ${current_track.artists.map(artist=>artist.name).join(", ")}`:''}}</span>
        <div class="scrubber">
          <span class="progress-time">{{current_track?getMinutesSeconds(progress):'-:--'}}</span>
          <span class="duration-time">{{current_track?getMinutesSeconds(duration):'-:--'}}</span>
          <div v-if="current_track" :class="{'scrubber-progress': true, 'smooth': smooth}" :style="{width: `${progress_percent}%`}"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {widgetSettings} from '@/widgetHelpers'
import SpotifyAPI from '@/api/spotify'
import MISSING_ALBUM_ART from '@/assets/MissingAlbumArt.png'

const ALBUM_TARGET_WIDTH = 64

export const widget = {
  name: "Spotify",
  settings: {
    volume: {
      name: "Volume",
      default: .5,
      type: 'number',
      min: 0,
      max: 1
    },
    align: {
      name: "Alignment",
      default: "top",
      type: 'enum',
      enumerations: [{value: "top", name: "Top"}, {value: "middle", name: "Middle"}, {value: "bottom", name: "Bottom"}]
    },
  }
}

export default {
  name: "Spotify",
  props: {
    id: String
  },
  methods: {
    getMinutesSeconds(time) {
      time = Math.floor(time / 1000);
      return `${Math.floor(time / 60)}:${('' + time % 60).padStart(2, '0')}`
    },
    async update(state = null) {
      if (this.fetching) return;
      this.fetching = true;
      if (!state) state = await this.player.getCurrentState();
      if (state == null) {
        state = await SpotifyAPI.request('https://api.spotify.com/v1/me/player')
        const {progress_ms = -1, is_playing = false, item = null} = state;
        this.duration = item?item.duration_ms:-1;
        let diff = progress_ms-this.progress
        this.smooth = diff < 2000 && diff > 0;
        this.progress = progress_ms;
        this.playing = is_playing;
        this.current_track = item;
        this.fetching = false;
        return;
      }
      const {paused, position, track_window: {current_track}} = state;
      this.duration = current_track.duration_ms;
      let diff = position-this.progress
      this.smooth = diff < 2000 && diff > 0;
      this.progress = position;
      this.playing = !paused;
      this.current_track = current_track;
      this.fetching = false;
    }
  },
  data(){return{
    player: null,
    current_track: null,
    next_track: null,
    duration: 300000,
    progress: 150000,
    updateTimeout: null,
    smooth: false,
    MISSING_ALBUM_ART,
  }},
  computed: {
    track_art() {
      return this.current_track == null?'':(this.current_track.album.images.length > 1 ? JSON.parse(JSON.stringify(this.current_track.album.images)).sort((a, b)=>{
        return Math.abs(a.width - ALBUM_TARGET_WIDTH) - Math.abs(b.width - ALBUM_TARGET_WIDTH)
      })[0] : this.current_track.album.images[0]).url;
    },
    progress_percent() {
      return Math.floor(this.progress / this.duration * 100 * 10000)/ 10000;
    },
    ...widgetSettings(Object.keys(widget.settings))
  },
  created() {
    SpotifyAPI.auth().then(()=>{
      this.player = SpotifyAPI.getNewPlayer({name: "Smart Mirror", volume: this.volume})
      this.player.on('authentication_error', (err)=>{
        this.$error("Spotify authenitaction error", err);
      })
      this.player.addListener('not_ready', ({device_id})=>{
        this.$log("Spotify not ready on device " + device_id);
      })
      this.player.addListener('ready', ({device_id})=>{
        this.$log("Spotify ready on device " + device_id);
      })
      this.player.addListener('player_state_changed', (state)=>{
        this.update(state)
      })
      this.player.on('playback_error', (message) => {
        this.$error('Failed to perform playback', message);
      });
      this.player.on('account_error', (message) => {
        this.$error('Spotify account error.', message);
      });
      this.player.on('initialization_error', (message) => {
        this.$error('Spotify initialization error', message);
      });
      this.player.connect().then(success => {
        if (success) {
          this.$log("Spotify player connected!");
        }
      })
      this.updateTimeout = setInterval(this.update.bind(this), 1000)
    }).catch((err)=>console.error(err.stack))
  },
  beforeDestroy() {
    clearInterval(this.updateTimeout)
    this.player.disconnect()
  }
}
</script>

<style lang="css" scoped>
  .spotify {
    padding: 1rem;
    font-size: 10pt;
    font-family: "Roboto";
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .player {
    display: flex;
    /* width: 100%; */
    overflow: hidden;
  }

  .album-art {
    width: 64px;
    height: 64px;
    position: relative;
  }

  .album-art::after {
    background-image: url('/assets/MissingAlbumArt.png');
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    content: "";
    display: block;
    z-index: 10;
  }

  .player-info {
    display: flex;
    position: relative;
    flex-direction: column;
    align-items: flex-start;
    padding-left: 10px;
    overflow: hidden;
    flex-grow: 1;
  }

  .now-playing-title {
    color: #999;
  }

  .now-playing {
    overflow: hidden;
    white-space: nowrap;
    max-width: calc(100% - 3rem);
  }

  .spotify-logo {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 21px;
  }

  .scrubber {
    width: 100%;
    background: #333;
    height: 3px;
    position: relative;
    margin: 10px 0px;
    display: block;
  }

  .scrubber-progress {
    height: 100%;
    background: white;
    position: absolute;
    top: 0;
    left: 0;
  }

  .scrubber-progress.smooth {
    transition: width 1s linear;
  }

  .scrubber-progress::after {
    content: "";
    display: block;
    width: 9px;
    height: 9px;
    border-radius: 100%;
    background: white;
    position: absolute;
    top: -2.8px;
    right: 0;
    transform: translate(50%, 0);
    box-shadow: 0 0 5px 0 #000;
  }

  .progress-time {
    position: absolute;
    top: 7px;
    left: 0;
  }

  .duration-time {
    position: absolute;
    top: 7px;
    right: 0;
  }
</style>
