<script>
    import { onMount, onDestroy } from "svelte";
  
    const NOSE_INDEX = 0;
    const LEFT_EYE_INDEX = 2;
    const RIGHT_EYE_INDEX = 5;
    const LEFT_SHOULDER_INDEX = 11;
    const MOUTH_LEFT_INDEX = 9;
    const MOUTH_RIGHT_INDEX = 10;
    const RIGHT_SHOULDER_INDEX = 12;
    const LEFT_ELBOW_INDEX = 13;
    const RIGHT_ELBOW_INDEX = 14;
    const LEFT_INDEX_INDEX = 19;
    const RIGHT_INDEX_INDEX = 20;
    const LEFT_WRIST_INDEX = 15;
    const RIGHT_WRIST_INDEX = 16;
    const LEFT_HIP_INDEX = 23;
    const RIGHT_HIP_INDEX = 24;
    const LEFT_KNEE_INDEX = 25;
    const RIGHT_KNEE_INDEX = 26;
    const LEFT_HEEL_INDEX = 29;
    const RIGHT_HEEL_INDEX = 30;
    const LEFT_FOOT_INDEX = 31;
    const RIGHT_FOOT_INDEX = 32;
  
    const MIN_VISIBILITY = 0.4;
  
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
      ctx.strokeStyle = "#D0F4DF";
      ctx.fillStyle = "#D0F4DF";
  
      const drawCircleFn = drawCircle;
  
      drawCircleFn(landmarks[LEFT_ELBOW_INDEX]);
      drawCircleFn(landmarks[RIGHT_ELBOW_INDEX]);
  
      ctx.stroke();
      ctx.fill();
    }
  
    function drawCircle(landmark) {
      let { x, y } = landmark;
      let size = calculateSizeBasedOnYCoordinate(y);
  
      ctx.beginPath();
      ctx.arc(x * poseData.width, y * poseData.height, size, 0, 2 * Math.PI);
      ctx.closePath();
    }
  
    function calculateSizeBasedOnYCoordinate(y) {
      const minSize = 5;
      const maxSize = 150;
      const screenHeight = poseData.height;
      const normalizedY = Math.max(0, Math.min(1, y)); // Clamp y value between 0 and 1
      return minSize + normalizedY * (maxSize - minSize);
    }
  
    $: drawFrame($currentFrame);
  </script>
  
  <canvas bind:this={canvasElement} />
  
  <style>
    canvas {
      max-width: 100%;
    }
  </style>