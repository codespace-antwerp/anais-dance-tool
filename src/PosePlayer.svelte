<script>
  import { onMount } from "svelte";

  const NOSE_INDEX = 0;
  const LEFT_SHOULDER_INDEX = 11;
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
  export let isPlaying;
  let canvasElement, ctx;

  onMount(() => {
    console.log("mounted");
    canvasElement.width = poseData.width;
    canvasElement.height = poseData.height;
    ctx = canvasElement.getContext("2d");
    drawFrame(currentFrame);
  });

  function drawFrame(frame) {
    if (!ctx) return;
    const landmarks = poseData.frames[frame];
    if (landmarks.length === 0) return;
    ctx.strokeStyle = "#47BCC9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    drawLine(landmarks[LEFT_SHOULDER_INDEX], landmarks[RIGHT_SHOULDER_INDEX]);
    drawLine(landmarks[LEFT_SHOULDER_INDEX], landmarks[LEFT_ELBOW_INDEX]);
    drawLine(landmarks[RIGHT_SHOULDER_INDEX], landmarks[RIGHT_ELBOW_INDEX]);
    drawLine(landmarks[LEFT_ELBOW_INDEX], landmarks[LEFT_WRIST_INDEX]);
    drawLine(landmarks[RIGHT_ELBOW_INDEX], landmarks[RIGHT_WRIST_INDEX]);
    drawLine(landmarks[RIGHT_INDEX_INDEX], landmarks[RIGHT_WRIST_INDEX]);
    drawLine(landmarks[LEFT_INDEX_INDEX], landmarks[LEFT_WRIST_INDEX]);
    drawLine(landmarks[RIGHT_SHOULDER_INDEX], landmarks[RIGHT_HIP_INDEX]);
    drawLine(landmarks[LEFT_SHOULDER_INDEX], landmarks[LEFT_HIP_INDEX]);
    drawLine(landmarks[RIGHT_HIP_INDEX], landmarks[LEFT_HIP_INDEX]);
    drawLine(landmarks[RIGHT_HIP_INDEX], landmarks[RIGHT_KNEE_INDEX]);
    drawLine(landmarks[LEFT_HIP_INDEX], landmarks[LEFT_KNEE_INDEX]);
    drawLine(landmarks[LEFT_KNEE_INDEX], landmarks[LEFT_HEEL_INDEX]);
    drawLine(landmarks[RIGHT_KNEE_INDEX], landmarks[RIGHT_HEEL_INDEX]);
    drawLine(landmarks[RIGHT_HEEL_INDEX], landmarks[RIGHT_FOOT_INDEX]);
    drawLine(landmarks[LEFT_HEEL_INDEX], landmarks[LEFT_FOOT_INDEX]);
    ctx.stroke();
  }

  function drawLine(landmark1, landmark2) {
    if (
      landmark1.visibility >= MIN_VISIBILITY &&
      landmark2.visibility >= MIN_VISIBILITY
    ) {
      let { x: x1, y: y1 } = landmark1;
      let { x: x2, y: y2 } = landmark2;
      ctx.moveTo(x1 * poseData.width, y1 * poseData.height);
      ctx.lineTo(x2 * poseData.width, y2 * poseData.height);
    }
  }

  $: drawFrame(currentFrame);

  // $: if (videoElement) {
  //   if ($isPlaying) {
  //     videoElement.play();
  //   } else {
  //     videoElement.pause();
  //   }
  // }

  // $: if (videoElement) {
  //   // console.log("time");
  //   videoElement.currentTime = $currentTime;
  // }

  //   const debouncedUpdateTime = debounce(($currentTime) => {
  //     if (videoElement) {
  //       videoElement.currentTime = $currentTime;
  //     }
  //   }, 200);
  //   currentTime.subscribe(debouncedUpdateTime);
</script>

<canvas bind:this={canvasElement} />

<style>
  canvas {
    max-width: 100%;
  }
</style>
