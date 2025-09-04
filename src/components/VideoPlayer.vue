<template>
  <div
    ref="videoContainer"
    id="canvas-container"
    class="mx-auto pa-0"
    style="width: 100%; height: 100%"
  >
    <div class="viewer">
      <video ref="video" style="display: none">
        <source :src="videoData.source" :type="videoData.type" />
      </video>
      <!-- Three.js renderer canvas -->
      <canvas ref="threeCanvas" id="canvas" width="128" height="72"></canvas>
      <!-- 2D overlay for bounding boxes -->
      <canvas
        ref="overlayCanvas"
        class="overlay"
        id="overlayCanvas"
        width="128"
        height="72"
      ></canvas>
      <div v-if="showVideoControls" class="viewer-controls w-100">
        <VideoControls
          @previousFrame="previousFrame"
          @playVideo="playVideo"
          @pauseVideo="pauseVideo"
          @nextFrame="nextFrame"
          @playFrame="playFrame"
          @toggleFullscreen="toggleFullscreen"
          :isPlaying="isPlaying"
          :currentFrame="videoData.currentFrame"
          :currentDuration="videoData.currentDuration"
          :duration="videoData.duration"
          :isFullscreen="isFullscreen"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";
import VideoControls from "./VideoControls.vue";
import { drawBoundingBoxes, currentFrameAnnotationNo } from "../helpers/videoHelper";

// Define props
const props = defineProps({
  videoSource: String,
  annotationSource: String, 
  fps: Number,
});

const annotations = ref({});
const videoContainer = ref(null);
const threeCanvas = ref(null);
const overlayCanvas = ref(null);
const video = ref(null);
const ctx = ref(null);
const isPlaying = ref(false);
const showVideoControls = ref(true);
const mouseDown = ref(false);
const isMovement = ref(false);
const isFullscreen = ref(false);
const videoData = ref({
  source: props.videoSource,
  type: "video/mp4",
  fps: props.fps,
  duration: 0,
  currentDuration: 0,
  currentFrame: 0,
});

let renderer, scene, camera;

const estimateCurrentFrame = (currentTime) => {
  return Math.floor(currentTime * videoData.value.fps) ?? 1;
};

// Draw the current frame
const drawFrame = () => {
  if (!video.value) return;

  videoData.value.currentFrame = estimateCurrentFrame(video.value.currentTime);
  videoData.value.currentDuration = video.value.currentTime;
  setDrawBoundingBoxes(currentFrameAnnotationNo(video.value.currentTime));
};

// Function to play the video
const playVideo = () => {
  if (!video.value) return;

  video.value.play();
  isPlaying.value = true;
  drawFrame();
};

// Function to pause video
const pauseVideo = () => {
  video.value?.pause();
  isPlaying.value = false;
  drawFrame();
};

// Function to move to the next frame
const nextFrame = () => {
  if (!video.value) return;

  // Move one frame forward
  video.value.pause();
  isPlaying.value = false;
  video.value.currentTime += 1 / videoData.value.fps;
  drawFrame();
};

// Function to move to the previous frame
const previousFrame = () => {
  if (!video.value) return;

  // Move one frame backward
  video.value.pause();
  isPlaying.value = false;
  video.value.currentTime -= 1 / videoData.value.fps;
  drawFrame();
};

// Function to play frame
const playFrame = (frame) => {
  if (!video.value) return;

  video.value.pause();
  isPlaying.value = false;
  video.value.currentTime = frame;
  videoData.value.currentFrame = estimateCurrentFrame(video.value.currentTime);
  drawFrame();
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    videoContainer.value.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
  resizeScene();
};

const setDrawBoundingBoxes = (frameNo) => {
  const frame = annotations.value?.[frameNo] ?? {};
  const boundingBoxes = frame?.annotations || [];
  // Iterate annotations as there can be multiple detections in a single frame
  if (boundingBoxes.length > 0) {
    drawBoundingBoxes(
      boundingBoxes,
      video.value.videoWidth,
      video.value.videoHeight,
      threeCanvas.value.width,
      threeCanvas.value.height,
      camera,
      ctx.value,
    );
  }
};

// Animation loop
const animate = () => {
  renderer.render(scene, camera);

  // clear overlay
  if (overlayCanvas.value) {
    ctx.value.clearRect(
      0,
      0,
      overlayCanvas.value.width,
      overlayCanvas.value.height,
    );
  }

  drawFrame();
  requestAnimationFrame(animate);
};

const setDimensionsAsContainer = (width, height) => {
  threeCanvas.value.width = width;
  threeCanvas.value.height = height;
  overlayCanvas.value.width = width;
  overlayCanvas.value.height = height;
};

// Three.js setup
const initThree = () => {
  const width = threeCanvas.value.width;
  const height = threeCanvas.value.height;

  renderer = new THREE.WebGLRenderer({ canvas: threeCanvas.value });
  renderer.setSize(width, height);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 1, 100);
  camera.position.set(0, 0, 0.1); // tiny offset
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const geometry = new THREE.SphereGeometry(15, 32, 16);

  const texture = new THREE.VideoTexture(video.value);

  // create a material from the texture
  const material = new THREE.MeshBasicMaterial({ map: texture });

  // need to use back side - surface of the sphere is facing outside but we put the camera inside of the sphere
  material.side = THREE.BackSide;

  // create a mesh and add to the scene
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
};

let resizeTimeout;
// Resize handler
const resizeScene = () => {
  if (!renderer || !camera) return;

  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const width = videoContainer.value.clientWidth;
    const height = videoContainer.value.clientHeight;
    overlayCanvas.value.width = width;
    overlayCanvas.value.height = height;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, 100);
};

// Event Listener functions
const mouseup = (e) => {
  if (e.button === 0) mouseDown.value = false;
}

const mousemove = (e) => {
  if (!mouseDown.value) return;

  const { movementX, movementY } = e;
  isMovement.value = true;

  // rotateX: rotate vertically since x-axis is horizontal
  const rotateX = movementY / 100;
  const rotateY = movementX / 100;

  camera.rotateX(rotateX);
  camera.rotateY(rotateY);
}

const mousedown = (e) => {
  if (e.button === 0) mouseDown.value = true;
}

const fullscreenchange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  resizeScene();
}


const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
const wheel = (e) => {
  e.preventDefault();
  camera.fov = clamp(camera.fov + e.deltaY / 10, 10, 120);
  // need to call this function after changing most of properties in PerspectiveCamera
  camera.updateProjectionMatrix();
};

onMounted(async () => {
  setDimensionsAsContainer(
    videoContainer.value.clientWidth,
    videoContainer.value.clientHeight,
  );

  const res = await fetch(props.annotationSource);
  const jsonData = await res.json();

  annotations.value = Object.entries(jsonData).map(([filename, details]) => ({
    filename,
    ...details,
  }));

  // Overlay canvas setup
  const canvas = overlayCanvas.value;
  ctx.value = canvas.getContext("2d");
  initThree();
  // zoom in / out
  renderer.domElement.addEventListener("wheel", wheel);
  animate();

  video.value.addEventListener("loadedmetadata", () => {
    videoData.value.duration = video.value.duration;
  });

  threeCanvas.value.addEventListener("click", (e) => {
    if (!isMovement.value) {
      showVideoControls.value = !showVideoControls.value;
    } else {
      isMovement.value = false;
    }
  });

  renderer.domElement.addEventListener("mousedown", mousedown);
  window.addEventListener("resize", resizeScene);
  window.addEventListener("mouseup", mouseup);
  window.addEventListener("mousemove", mousemove);
  document.addEventListener("fullscreenchange", fullscreenchange);
});

onBeforeUnmount(() => {
  renderer.dispose();
  scene.clear();
  renderer.domElement.removeEventListener("mousedown", mousedown);
  renderer.domElement.removeEventListener("wheel", wheel);
  window.removeEventListener("resize", resizeScene);
  window.removeEventListener("mouseup", mouseup);
  window.removeEventListener("mousemove", mousemove);
  document.removeEventListener("fullscreenchange", fullscreenchange);
});
</script>

<style>
#canvas-container:fullscreen {
  width: 100vw;
  height: 100vh;
  background: black;
  display: flex;
  justify-content: center;
  align-items: center;
}

#canvas-container:fullscreen canvas {
  width: 100%;
  height: 100%;
}

.viewer {
  position: relative;
  width: 100%;
  height: 100%;
}

.viewer canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.viewer-controls {
  position: absolute;
  bottom: 0;
  left: 0;
}

.overlay {
  pointer-events: none; /* lets mouse events pass to Three.js */
}
</style>
