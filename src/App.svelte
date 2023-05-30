<script>
  import { writable } from "svelte/store";
  import SkeletonPlayer from "./players/Skeleton.svelte";
  import InfiniteLinesPlayer from "./players/InfiniteLines.svelte";
  import TopViewPlayer from "./players/TopView.svelte";
  import ColorPlayer from "./players/Color.svelte";
  import FadePlayer from "./players/Fade.svelte";
  import GlitchPlayer from "./players/Glitch.svelte";
  import MirrorPlayer from "./players/Mirror.svelte";
  import RectanglePlayer from "./players/Rectangle.svelte";
  import ShapesPlayer from "./players/Shapes.svelte";
  import SpacemanPlayer from "./players/Spaceman.svelte";
  import Timeline from "./Timeline.svelte";
  import { frameToTime } from "./helpers";
  import { parseBvh, calculatePoseData } from "./bvh-loader";

  let isLoading = true;
  let poseData;
  let playerMethod = "skeleton";
  let lineThickness = 1;

  async function loadBvhFile() {
    isLoading = true;
    const URL = `https://codespacehelp.s3.amazonaws.com/students/2022-anais-gentjes-mocap/${$fileName}`;
    const response = await fetch(URL);
    const data = await response.text();
    const bvhData = parseBvh(data);
    poseData = calculatePoseData(bvhData);
    isLoading = false;
  }

  const currentFrame = writable(1);
  const isPlaying = writable(false);
  let timer;
  let fileName = writable("2023-05-04-walk.bvh");
  let playbackSpeed = writable(0);

  function startPlayback() {
    if (!poseData) return;
    clearInterval(timer);

    // console.log($playbackSpeed)

    let realPlaybackSpeed = 1;
    if ($playbackSpeed === -2) {
      realPlaybackSpeed = 0.25;
    } else if ($playbackSpeed === -1) {
      realPlaybackSpeed = 0.5;
    } else if ($playbackSpeed === 0) {
      realPlaybackSpeed = 1;
    } else if ($playbackSpeed === 1) {
      realPlaybackSpeed = 2;
    } else if ($playbackSpeed === 2) {
      realPlaybackSpeed = 4;

    }

    timer = setInterval(() => {
      let nextFrame = $currentFrame + 1;
      if (nextFrame >= poseData.frames.length) {
        nextFrame = 1;
      }
      currentFrame.set(nextFrame);
    }, 1000 / (poseData.frameRate * realPlaybackSpeed));
  }

  function stopPlayback() {
    clearInterval(timer);
  }

  function calculateSpeedFactor(speed) {
    if (speed === 0) {
      return 1;
    } else if (speed === 1) {
      return 2;
    } else if (speed === 2) {
      return 2 * originalFrameRate;
    } else if (speed === -1) {
      return 0.5 / originalFrameRate;
    } else if (speed === -2) {
      return 0.5 / originalFrameRate;
    }
  }

  // function handlePlaybackSpeedChange(event) {
  //   const validValues = [0, 1, 2, -1, -2];
  //   const value = parseInt(event.target.value);

  //   if (validValues.includes(value)) {
  //     playbackSpeed.set(value);
  //   } else {
  //     event.target.value = $playbackSpeed;
  //   }
  // }

  $: {
    if ($isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }

  $: {
    if ($fileName) {
      loadBvhFile();
    }
  }

  $: {
    startPlayback($playbackSpeed);
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
    {:else if playerMethod === "color"}
      <ColorPlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "fade"}
      <FadePlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "glitch"}
      <GlitchPlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "mirror"}
      <MirrorPlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "rectangle"}
      <RectanglePlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "shapes"}
      <ShapesPlayer {poseData} {currentFrame} {lineThickness} />
    {:else if playerMethod === "spaceman"}
      <SpacemanPlayer {poseData} {currentFrame} {lineThickness} />
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
      <option value="color">Color</option>
      <option value="fade">Fade</option>
      <option value="glitch">Glitch</option>
      <option value="mirror">Mirror</option>
      <option value="rectangle">Rectangle</option>
      <option value="shapes">Shapes</option>
      <option value="spaceman">Spaceman</option>
    </select>

    <label>
      Playback Speed:
      <input type="range" min="-2" max="2" step="1" bind:value={$playbackSpeed} />
      {$playbackSpeed}
    </label>

    Thickness:
    <input type="range" min="1" max="100" bind:value={lineThickness} />
    {lineThickness}

    <Timeline {poseData} {currentFrame} {isPlaying} />

    Frame: {$currentFrame}
    Time: {frameToTime($currentFrame, poseData.frameRate).toFixed(2)}
  {/if}
</main>

