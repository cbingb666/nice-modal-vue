<script setup>
import NiceModal from "nice-modal-vue";
import DemoModal from "./modals/DemoModal/index.vue";

const openDemoModal = () => {
  NiceModal.show(DemoModal);
};

const NiceModalProvide = NiceModal.Provider;
</script>

<template>
  <NiceModalProvide> </NiceModalProvide>
  <h1>nice-modal-vue example</h1>
  <button @click="openDemoModal">打开 DemoModal</button>
</template>

<style scoped></style>
