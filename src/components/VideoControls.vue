<template>
  <!-- Custom Slider for Video Progress -->
  <div class="video-controls">
    <v-row class="px-4" justify="center">
      <v-slider
        v-model="sliderValue"
        :max="duration"
        :step="1"
        color="#b1b1b1"
        thumb-color="red"
        hide-details
        rounded
        class="ma-1"
        aria-label="Video progress slider"
      ></v-slider>
    </v-row>
    <div class="buttons-container d-flex py-3 px-1 px-sm-3">
      <div class="buttons-left d-flex">
        <p class="current-frame mt-2">Current Frame: {{ currentFrame }}</p>
      </div>
      <div class="d-flex buttons-middle">
        <v-btn
          icon="mdi-skip-previous"
          class="button-hover mr-4"
          aria-label="Previous frame"
          @click="emit('previousFrame')"
        ></v-btn>
        <v-btn
          icon
          class="button-hover"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          @click="isPlaying ? emit('pauseVideo') : emit('playVideo')"
        >
          <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play-outline' }}</v-icon>
        </v-btn>
        <v-btn
          icon="mdi-skip-next"
          class="button-hover ml-4"
          aria-label="Next frame"
          @click="emit('nextFrame')"
        ></v-btn>
      </div>
      <div class="d-flex buttons-right">
        <v-btn icon class="button-hover ml-4" aria-label="Toggle fullscreen" @click="emit('toggleFullscreen')">
          <v-icon>{{
            isFullscreen ? "mdi-fullscreen-exit" : "mdi-fullscreen"
          }}</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// Define props
const props = defineProps({
  isPlaying: Boolean,
  currentFrame: Number,
  currentDuration: Number,
  duration: Number,
  isFullscreen: Boolean,
});

// Define emits
const emit = defineEmits([
  "previousFrame",
  "playVideo",
  "pauseVideo",
  "nextFrame",
  "playFrame",
  "toggleFullscreen",
]);

const sliderValue = computed({
  get: () => props.currentDuration,
  set: (val) => emit('playFrame', val),
});
</script>

<style scoped>
.current-frame {
  display: flex;
  color: white;
  justify-content: center;
}

.video-controls {
  background-color: rgba(0, 0, 0, 0.1); /* Transparent black background */
}

.buttons-container {
  justify-content: space-evenly; /* space-between; */
}

.button-hover {
  transition: all 0.2s ease-in-out;
}

.button-hover:hover {
  transform: scale(1.1); /* Slight size increase */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* Shadow effect */
}

.buttons-left {
  flex-grow: 1;
  width: 110px;
  justify-content: flex-start;
}

.buttons-right {
  flex-grow: 1;
  width: 110px;
  justify-content: flex-end;
}

.buttons-middle {
  flex-grow: 2;
  justify-content: center;
}
</style>
