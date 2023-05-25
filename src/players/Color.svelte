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
  
      const x = landmarks[0].x; // Get the x coordinate of the first landmark (Nose)
      const color = calculateColorBasedOnXCoordinate(x);
  
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    }
  
    function calculateColorBasedOnXCoordinate(x) {
      const minHue = 0; // Minimum hue value (red)
      const maxHue = 240; // Maximum hue value (blue)
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