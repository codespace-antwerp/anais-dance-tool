<script>
  import { onMount } from "svelte";

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
  export let lineThickness = 1;
  let canvasElement, ctx;

  onMount(() => {
    console.log("mounted");
    canvasElement.width = poseData.width;
    canvasElement.height = poseData.height;
    ctx = canvasElement.getContext("2d");
    drawFrame($currentFrame);
  });

  function drawFrame(frame) {
    if (!ctx) return;
    let landmarks = poseData.frames[frame];
    if (!landmarks) return;
    if (landmarks.length !== 33) return;

    console.log(lineThickness)

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    //ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'
    //ctx.fillRect(0, 0, canvasElement.width, canvasElement.height)
    ctx.strokeStyle = "#D0F4DF";
    ctx.lineWidth = lineThickness;
    ctx.beginPath();

    const drawLineFn = drawLine;
    // const drawLineFn = drawLineInfinity;

    drawLineFn(landmarks[MOUTH_LEFT_INDEX], landmarks[MOUTH_RIGHT_INDEX]);
    drawLineFn(landmarks[LEFT_SHOULDER_INDEX], landmarks[RIGHT_SHOULDER_INDEX]);
    drawLineFn(landmarks[LEFT_SHOULDER_INDEX], landmarks[LEFT_ELBOW_INDEX]);
    drawLineFn(landmarks[RIGHT_SHOULDER_INDEX], landmarks[RIGHT_ELBOW_INDEX]);
    drawLineFn(landmarks[LEFT_ELBOW_INDEX], landmarks[LEFT_WRIST_INDEX]);
    drawLineFn(landmarks[RIGHT_ELBOW_INDEX], landmarks[RIGHT_WRIST_INDEX]);
    drawLineFn(landmarks[RIGHT_INDEX_INDEX], landmarks[RIGHT_WRIST_INDEX]);
    drawLineFn(landmarks[LEFT_INDEX_INDEX], landmarks[LEFT_WRIST_INDEX]);
    drawLineFn(landmarks[RIGHT_SHOULDER_INDEX], landmarks[RIGHT_HIP_INDEX]);
    drawLineFn(landmarks[LEFT_SHOULDER_INDEX], landmarks[LEFT_HIP_INDEX]);
    drawLineFn(landmarks[RIGHT_HIP_INDEX], landmarks[LEFT_HIP_INDEX]);
    drawLineFn(landmarks[RIGHT_HIP_INDEX], landmarks[RIGHT_KNEE_INDEX]);
    drawLineFn(landmarks[LEFT_HIP_INDEX], landmarks[LEFT_KNEE_INDEX]);
    drawLineFn(landmarks[LEFT_KNEE_INDEX], landmarks[LEFT_HEEL_INDEX]);
    drawLineFn(landmarks[RIGHT_KNEE_INDEX], landmarks[RIGHT_HEEL_INDEX]);
    drawLineFn(landmarks[RIGHT_HEEL_INDEX], landmarks[RIGHT_FOOT_INDEX]);
    drawLineFn(landmarks[LEFT_HEEL_INDEX], landmarks[LEFT_FOOT_INDEX]);
    ctx.stroke();

    ctx.fillStyle = "#D0F4DF";
    ctx.beginPath();
   // drawDot(landmarks[NOSE_INDEX]);
   //drawDot(landmarks[LEFT_EYE_INDEX]);
   //drawDot(landmarks[RIGHT_EYE_INDEX]);
    ctx.fill();
  }

  function drawLine(landmark1, landmark2) {
    // if (
    //   landmark1.visibility < MIN_VISIBILITY ||
    //   landmark2.visibility < MIN_VISIBILITY
    // )
    //   return;
    let { x: x1, y: y1 } = landmark1;
    let { x: x2, y: y2 } = landmark2;
    ctx.moveTo(x1 * poseData.width, y1 * poseData.height);
    ctx.lineTo(x2 * poseData.width, y2 * poseData.height);
  }

  function drawLineInfinity(landmark1, landmark2) {
    // if (
    //   landmark1.visibility < MIN_VISIBILITY ||
    //   landmark2.visibility < MIN_VISIBILITY
    // )
    //   return;

    const SCALE_FACTOR = 100000;

    let { x: x1, y: y1 } = landmark1;
    let { x: x2, y: y2 } = landmark2;

    let dx = x2 - x1;
    let dy = y2 - y1;

    let startX1 = x1 * poseData.width - dx * SCALE_FACTOR;
    let startY1 = y1 * poseData.height - dy * SCALE_FACTOR;
    let endX1 = x1 * poseData.width + dx * SCALE_FACTOR;
    let endY1 = y1 * poseData.height + dy * SCALE_FACTOR;

    ctx.moveTo(startX1, startY1);
    ctx.lineTo(endX1, endY1);
  }

  function drawDot(landmark) {
    // if (landmark.visibility < MIN_VISIBILITY) return;
    let { x, y } = landmark;
    ctx.moveTo(x * poseData.width, y * poseData.height);
    ctx.arc(x * poseData.width, y * poseData.height, 3, 0, 2 * Math.PI);
  }

  $: drawFrame($currentFrame, lineThickness);
</script>

<canvas bind:this={canvasElement} />

<style>
  canvas {
    max-width: 100%;
  }
</style>
