<script>
  import { writable } from "svelte/store";
  import PosePlayer from "./PosePlayer.svelte";
  import Timeline from "./Timeline.svelte";
  import { frameToTime } from "./helpers";

  let isLoading = true;
  // let isPlaying = false;
  let poseData;
  // let currentFrame = 10;

  async function loadPoseFile() {
    const response = await fetch("/pose_data.json");
    const data = await response.json();
    console.log(data);
    poseData = data;
    isLoading = false;
  }

  loadPoseFile();

  const currentFrame = writable(0);
  const isPlaying = writable(false);
  let timer;

  $: {
    if ($isPlaying) {
      clearInterval(timer);

      timer = setInterval(() => {
        currentFrame.set($currentFrame + 1);
        if ($currentFrame >= poseData.frames.length) {
          currentFrame.set(0);
        }
      }, 1000 / poseData.frameRate);
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
    <PosePlayer {poseData} {currentFrame} />
    <Timeline {poseData} {currentFrame} {isPlaying} />

    Frame: {$currentFrame}
    Time: {frameToTime($currentFrame, poseData.frameRate).toFixed(2)}
  {/if}
</main>
