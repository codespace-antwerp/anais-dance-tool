<script>
  export let poseData;
  export let currentFrame;
  export let isPlaying;

  function updateCurrentFrame(e) {
    currentFrame.set(parseInt(e.target.value));
  }

  function togglePlay() {
    isPlaying.set(!$isPlaying);
  }
</script>

<div>
  <input
    type="range"
    min="0"
    max={poseData.frameCount}
    step="1"
    value={$currentFrame}
    on:input={updateCurrentFrame}
  />
  <button on:click={togglePlay}>
    {$isPlaying ? "Pause" : "Play"}
  </button>
</div>
