<script setup>
import NiceModal from "nice-modal-vue";
import DemoModal from "../modals/DemoModal/index.vue";
const openDemoModal = () => {
  NiceModal.show(DemoModal);
};
</script>

<template>
  <main>
    <button @click="openDemoModal">Open DemoModal</button>
  </main>
</template>
