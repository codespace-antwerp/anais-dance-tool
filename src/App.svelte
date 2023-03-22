<script>
  import { writable } from "svelte/store";
  import PosePlayer from "./PosePlayer.svelte";
  import Timeline from "./Timeline.svelte";
  import { frameToTime } from "./helpers";

  let isLoading = true;
  // let isPlaying = false;
  let poseData;
  let currentFrame = 10;

  async function loadPoseFile() {
    const response = await fetch("/pose_data.json");
    const data = await response.json();
    poseData = data;
    isLoading = false;
  }

  function setCurrentFrame(frame) {
    console.log(`Setting current frame to ${frame}`);
    currentFrame = frame;
  }

  loadPoseFile();

  // const currentFrame = writable(0);
  const isPlaying = writable(false);
  let timer;

  $: {
    if ($isPlaying) {
      timer = setInterval(() => {
        currentFrame = currentFrame + 1;
      }, 10000 / poseData.frameRate);
      // console.log("Playing");
    } else {
      clearInterval(timer);
      // console.log("Paused");
    }
  }
</script>

<main>
  {#if isLoading}
    <p>Loading...</p>
  {:else}
    <PosePlayer {poseData} {currentFrame} {isPlaying} />
    <Timeline {poseData} {currentFrame} {setCurrentFrame} {isPlaying} />

    Frame: {currentFrame}
    Time: {frameToTime(currentFrame, poseData.frameRate)}
    <br />
    Is playing: {$isPlaying}
  {/if}
</main>
