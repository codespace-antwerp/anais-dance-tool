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
    isLoading = true;
    isPlaying.set(false);
    currentFrame.set(1);
    const URL = `https://codespacehelp.s3.amazonaws.com/students/2022-anais-gentjes-mocap/${$fileName}`;
    const response = await fetch(URL);
    const data = await response.text();
    const bvhData = parseBvh(data);
    console.log(bvhData);
    poseData = calculatePoseData(bvhData);
    isLoading = false;
  }

  const currentFrame = writable(1);
  const isPlaying = writable(false);
  let timer;
  let fileName = writable("2023-05-04-walk.bvh");

  // loadPoseFile();
  loadBvhFile();

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

  $: {
    if ($fileName) {
      loadBvhFile();
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

    <select bind:value={$fileName}>
      <option>2023-05-04-cycles.bvh</option>
      <option>2023-05-04-ground-1.bvh</option>
      <option>2023-05-04-ground-2.bvh</option>
      <option>2023-05-04-hands.bvh</option>
      <option>2023-05-04-improv-1-1.bvh</option>
      <option>2023-05-04-improv-1-2.bvh</option>
      <option>2023-05-04-improv-1-3.bvh</option>
      <option>2023-05-04-improv-2-1.bvh</option>
      <option>2023-05-04-improv-2-2.bvh</option>
      <option>2023-05-04-improv-2-3.bvh</option>
      <option>2023-05-04-ragdoll.bvh</option>
      <option>2023-05-04-walk.bvh</option>
    </select>

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
