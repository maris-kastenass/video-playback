<template>
  <div class="d-flex align-center justify-center mt-4">
    <div class="pa-0 place-in-app">
      <VideoPlayer
        videoSource="/GS012237-stitched2.mp4"
        annotationSource="/defects_coco_GS012237_1719791982345517.json" 
        :fps="29.97"
      />
    </div>
  </div>
</template>

<script setup>
import VideoPlayer from "./components/VideoPlayer.vue";
</script>

<style scoped>
.place-in-app {
  vertical-align: middle;
  width: 960px;
  height: 540px;
}
</style>
