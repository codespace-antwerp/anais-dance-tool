<script setup>

defineProps({
  video: String,
})



</script>

<template>
    <video controls muted autoplay>
        <source :src="video" type="video/mp4" >
    </video>    
</template>

<style scoped>
video {
    max-width: 100%;
}


</style>