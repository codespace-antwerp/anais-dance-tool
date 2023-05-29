<script>
  import { onMount, onDestroy } from "svelte";

  export let poseData;
  export let currentFrame;
  let canvasElement, ctx;

  onMount(() => {
    console.log("mounted");
    canvasElement.width = poseData.width;
    canvasElement.height = poseData.height;
    ctx = canvasElement.getContext("2d");

    drawFrame($currentFrame);
  });

  onDestroy(() => {
    // Clean up any resources if needed
  });

  function drawFrame(frame) {
    if (!ctx) return;
    let landmarks = poseData.frames[frame];
    if (!landmarks) return;
    if (landmarks.length !== 33) return;

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const rightFootIndex = 30; // Index of the right foot in the landmarks array
    const x = landmarks[rightFootIndex].x; // Get the x coordinate of the right foot
    const color = calculateColorBasedOnXCoordinate(x);

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  }

  function calculateColorBasedOnXCoordinate(x) {
    const minHue = 240; // Minimum hue value (blue)
    const maxHue = 0; // Maximum hue value (red)
    const screenWidth = poseData.width;
    const normalizedX = Math.max(0, Math.min(1, x)); // Clamp x value between 0 and 1
    const hue = minHue + normalizedX * (maxHue - minHue);
    return `hsl(${hue}, 100%, 50%)`;
  }

  $: drawFrame($currentFrame);
</script>

<canvas bind:this={canvasElement} />

<style>
  canvas {
    max-width: 100%;
  }
</style>
