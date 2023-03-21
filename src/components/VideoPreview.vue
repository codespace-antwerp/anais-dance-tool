<script setup>
import { onMounted } from 'vue';


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



defineProps({
  video: String,
})

let landmarks = [];

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

onMounted(() => {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const camera = new  window.Camera(video, {
      onFrame: async () => {
        await pose.send({ image: video });
      },
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
    });
    camera.start();
  

    video.addEventListener('play', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setInterval(async () => {
            // console.log(pose)

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            for (const landmark of landmarks) {
                const x = landmark.x * canvas.width;
                const y = landmark.y * canvas.height;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
            }


            ctx.strokeStyle = "#47BCC9";
        ctx.lineWidth = 5;
        ctx.beginPath();

            drawLine(ctx, landmarks[RIGHT_SHOULDER_INDEX], landmarks[LEFT_SHOULDER_INDEX]);

        //     this.drawLine(landmarks[LEFT_SHOULDER_INDEX], landmarks[RIGHT_SHOULDER_INDEX]);
        // this.drawLine(landmarks[LEFT_SHOULDER_INDEX], landmarks[LEFT_ELBOW_INDEX]);
        // this.drawLine(landmarks[RIGHT_SHOULDER_INDEX], landmarks[RIGHT_ELBOW_INDEX]);
        // this.drawLine(landmarks[LEFT_ELBOW_INDEX], landmarks[LEFT_WRIST_INDEX]);
        // this.drawLine(landmarks[RIGHT_ELBOW_INDEX], landmarks[RIGHT_WRIST_INDEX]);
        // this.drawLine(landmarks[RIGHT_INDEX_INDEX], landmarks[RIGHT_WRIST_INDEX]);
        // this.drawLine(landmarks[LEFT_INDEX_INDEX], landmarks[LEFT_WRIST_INDEX]);
        // this.drawLine(landmarks[RIGHT_SHOULDER_INDEX], landmarks[RIGHT_HIP_INDEX]);
        // this.drawLine(landmarks[LEFT_SHOULDER_INDEX], landmarks[LEFT_HIP_INDEX]);
        // this.drawLine(landmarks[RIGHT_HIP_INDEX], landmarks[LEFT_HIP_INDEX]);
        // this.drawLine(landmarks[RIGHT_HIP_INDEX], landmarks[RIGHT_KNEE_INDEX]);
        // this.drawLine(landmarks[LEFT_HIP_INDEX], landmarks[LEFT_KNEE_INDEX]);
        // this.drawLine(landmarks[LEFT_KNEE_INDEX], landmarks[LEFT_HEEL_INDEX]);
        // this.drawLine(landmarks[RIGHT_KNEE_INDEX], landmarks[RIGHT_HEEL_INDEX]);
        // this.drawLine(landmarks[RIGHT_HEEL_INDEX], landmarks[RIGHT_FOOT_INDEX]);
        // this.drawLine(landmarks[LEFT_HEEL_INDEX], landmarks[LEFT_FOOT_INDEX]);

            ctx.stroke();


            // await pose.send({image: canvas})
            // ctx.fillRect(0, 0, 100, 100)
        }, 1000 / 30);
    });
})

function drawLine(ctx, landmark1, landmark2) {
    if (landmark1.visibility >= MIN_VISIBILITY && landmark2.visibility >= MIN_VISIBILITY) {
      let { x: x1, y: y1 } = landmark1;
      let { x: x2, y: y2 } = landmark2;
      ctx.moveTo(x1 * VIDEO_WIDTH, y1 * VIDEO_HEIGHT);
      ctx.lineTo(x2 * VIDEO_WIDTH, y2 * VIDEO_HEIGHT);
    }
  }


const onResults = (results) => {
    console.log('onResults', results);
    landmarks = results.poseLandmarks;
}

const pose = new window.Pose({locateFile: (file) => {
  return `/mediapipe/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);


</script>

<template>
    <video controls muted autoplay>
        
    </video>

    <canvas ref="canvas">

    </canvas>



</template>

<style scoped>
video {
    /* display: none; */
    max-width: 10%;
}

canvas {
    max-width: 100%;
}


</style>