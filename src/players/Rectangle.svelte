<script>
    import { onMount, onDestroy } from "svelte";
  
    const LEFT_FOOT_INDEX = 31;
    const RIGHT_FOOT_INDEX = 32;
  
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
      
      const leftFootX = landmarks[LEFT_FOOT_INDEX].x * poseData.width;
      const rightFootX = landmarks[RIGHT_FOOT_INDEX].x * poseData.width;
  
      const rectWidth = Math.abs(rightFootX - leftFootX);
      const rectHeight = 1000; // Adjust the height of the rectangle as desired
      const rectX = (leftFootX + rightFootX) / 2 - rectWidth / 2;
      const rectY = canvasElement.height / 2 - rectHeight / 2;
  
      ctx.fillStyle = getColorBasedOnXCoordinates(leftFootX, rightFootX);
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    }
  
    function getColorBasedOnXCoordinates(leftX, rightX) {
      const redValue = Math.round((rightX > leftX ? rightX : leftX) * 255);
      const blueValue = Math.round((rightX < leftX ? rightX : leftX) * 255);
      return `rgb(${redValue}, 0, ${blueValue})`;
    }
  
    $: drawFrame($currentFrame);
  </script>
  
  <canvas bind:this={canvasElement} />
  
  <style>
    canvas {
      max-width: 100%;
    }
  </style>