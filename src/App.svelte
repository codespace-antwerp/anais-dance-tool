<script>
  import { writable } from "svelte/store";
  import SkeletonPlayer from "./players/Skeleton.svelte";
  import InfiniteLinesPlayer from "./players/InfiniteLines.svelte";
  import TopViewPlayer from "./players/TopView.svelte";
  import Timeline from "./Timeline.svelte";
  import { frameToTime } from "./helpers";
  import { parseBvh, calculatePoseData } from "./bvh-loader";

  let isLoading = true;
  // let isPlaying = false;
  let poseData;
  let playerMethod = "skeleton";
  let lineThickness = 1;
  // let currentFrame = 10;

  async function loadPoseFile() {
    const response = await fetch("/pose_data.json");
    const data = await response.json();
    console.log(data);
    poseData = data;
    isLoading = false;
  }

  async function loadBvhFile() {
    const response = await fetch("/walk.bvh");
    const data = await response.text();
    const bvhData = parseBvh(data);
    console.log(bvhData);
    poseData = calculatePoseData(bvhData);
    isLoading = false;
  }

  loadPoseFile();
  // loadBvhFile();

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
    {#if playerMethod === "skeleton"}
      <SkeletonPlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "infiniteLines"}
      <InfiniteLinesPlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "topView"}
      <TopViewPlayer {poseData} {currentFrame} {lineThickness} />
    {/if}

    <select bind:value={playerMethod}>
      <option value="skeleton">Skeleton</option>
      <option value="infiniteLines">Infinite Lines</option>
      <option value="topView">Top View</option>
    </select>

    Thickness:
    <input type="range" min="1" max="100" bind:value={lineThickness} />
    {lineThickness}

    <Timeline {poseData} {currentFrame} {isPlaying} />

    Frame: {$currentFrame}
    Time: {frameToTime($currentFrame, poseData.frameRate).toFixed(2)}
  {/if}
</main>
