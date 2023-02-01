<template>
  <el-dialog
    v-bind="modalState.props"
    v-on="modalState.on"
    title="DemoModal"
    width="30%"
  >
    <span>This is a message</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="clickCancel">Cancel</el-button>
        <el-button type="primary" @click="clickConfirm"> Confirm </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { elementDialogAdapter } from "nice-modal-vue";
export default {
  props: {
    /**
     * 模态窗控制器 (由 NiceModal 自动帮你挂载进去的 Props 通过对模态框控制的 API)
     */
    modalCtrl: Object,
    value: String,
  },
  computed: {
    /** 模态框状态 */
    modalState() {
      return elementDialogAdapter(this.modalCtrl);
    },
  },
  data() {
    return {};
  },
  methods: {
    clickCancel() {
      this.modalCtrl.hideWithResolve();
    },
    clickConfirm() {
      this.modalCtrl.hideWithResolve();
    },
  },
};
</script>

<style scoped></style>
