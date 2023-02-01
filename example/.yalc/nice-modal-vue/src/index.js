import { normalizeSlots } from "./utils/normalizeVue";
import { h as vue3H } from "vue";

let uidSeed = 0;
const symModalId = Symbol("NiceModalId");
const MODAL_REGISTRY = {};
const ALREADY_MOUNTED = {};
const modalCallbacks = {};
const hideModalCallbacks = {};
const initialState = {};

const getUid = () => `nice_modal_${uidSeed++}`;

let dispatch = () => {
  throw new Error(
    "No dispatch method detected, did you embed your app with NiceModal.Provider?"
  );
};

const getModalId = (modal) => {
  if (typeof modal === "string") return modal;
  if (!modal[symModalId]) {
    modal[symModalId] = getUid();
  }
  return modal[symModalId];
};

const register = (id, comp, props) => {
  if (!MODAL_REGISTRY[id]) {
    MODAL_REGISTRY[id] = {
      comp,
      props,
    };
  } else {
    MODAL_REGISTRY[id].props = props;
  }
};

const unregister = (id) => {
  delete MODAL_REGISTRY[id];
};

// action creator to show a modal
function showModal(modalId, args) {
  return {
    type: "nice-modal/show",
    payload: {
      modalId,
      args,
    },
  };
}

// action creator to hide a modal
function hideModal(modalId) {
  return {
    type: "nice-modal/hide",
    payload: {
      modalId,
    },
  };
}

// action creator to remove a modal
function removeModal(modalId) {
  return {
    type: "nice-modal/remove",
    payload: {
      modalId,
    },
  };
}

const show = (modal, args) => {
  const modalId = getModalId(modal);
  if (typeof modal !== "string" && !MODAL_REGISTRY[modalId]) {
    register(modalId, modal);
  }
  dispatch(showModal(modalId, args));

  if (!modalCallbacks[modalId]) {
    let theResolve;
    let theReject;
    const promise = new Promise((resolve, reject) => {
      theResolve = resolve;
      theReject = reject;
    });
    modalCallbacks[modalId] = {
      resolve: theResolve,
      reject: theReject,
      promise,
    };
  }
  return modalCallbacks[modalId].promise;
};

export function hide(modal) {
  const modalId = getModalId(modal);
  dispatch(hideModal(modalId));
  // Should also delete the callback for modal.resolve #35
  delete modalCallbacks[modalId];
  if (!hideModalCallbacks[modalId]) {
    // `!` tell ts that theResolve will be written before it is used
    let theResolve;
    // `!` tell ts that theResolve will be written before it is used
    let theReject;
    const promise = new Promise((resolve, reject) => {
      theResolve = resolve;
      theReject = reject;
    });
    hideModalCallbacks[modalId] = {
      resolve: theResolve,
      reject: theReject,
      promise,
    };
  }
  return hideModalCallbacks[modalId].promise;
}

export function remove(modalId) {
  dispatch(removeModal(modalId));
  delete modalCallbacks[modalId];
  delete hideModalCallbacks[modalId];
}

const Provider = {
  name: "NiceModalProvider",
  data() {
    return {
      modals: initialState,
    };
  },
  methods: {
    dispatch({ type, payload }) {
      switch (type) {
        case "nice-modal/show": {
          const { modalId, args } = payload;
          const shouldMount = this.modals?.[modalId]?.shouldMount;
          if (this.$set) {
            this.$set(this.modals, modalId, {
              id: modalId,
              args,
              visible: !!shouldMount,
              shouldMount: true,
            });
          } else {
            this.modals[modalId] = {
              id: modalId,
              args,
              visible: !!shouldMount,
              shouldMount: true,
            };
          }
          break;
        }

        case "nice-modal/hide": {
          const { modalId } = payload;
          if (!this.modals[modalId]) return this.modals;
          if (this.$set) {
            this.$set(this.modals, modalId, {
              ...this.modals[modalId],
              visible: false,
            });
          } else {
            this.modals[modalId] = {
              ...this.modals[modalId],
              visible: false,
            };
          }
          break;
        }

        case "nice-modal/remove": {
          const { modalId } = payload;
          // const newState = { ...this.modals };
          this.$delete(this.modals, modalId);
          // delete newState[modalId];
          // this.modals = { ...newState };
          break;
        }

        default:
          break;
      }
    },
  },
  provide() {
    return {
      modals: this.modals,
    };
  },
  created() {
    dispatch = this.dispatch;
  },
  render(vue2h) {
    const h = vue3H ? vue3H : vue2h;
    const visibleModalIds = Object.keys(this.modals);
    // .filter(
    //   (id) => !!this.modals[id]
    // );
    visibleModalIds.forEach((id) => {
      if (!MODAL_REGISTRY[id] && !ALREADY_MOUNTED[id]) {
        console.warn(
          `No modal found for id: ${id}. Please check the id or if it is registered or declared via JSX.`
        );
        return;
      }
    });

    const children = visibleModalIds
      .filter((id) => MODAL_REGISTRY[id])
      .map((id) => ({
        id,
        ...MODAL_REGISTRY[id],
      }))
      .map((modal) => {
        return h(NiceModalHoc(modal.comp), {
          props: {
            ...modal,
            ...modal.props,
          },
        });
      });

    const slots = Object.keys(this.$slots)
      .reduce((arr, key) => arr.concat(this.$slots[key]), [])
      // 手动更正 context
      .map((vnode) => {
        vnode.context = this._self;
        return vnode;
      });

    return h(
      "div",
      {
        staticClass: "nice-modal-provide",
      },
      [slots, h("div", { staticClass: "nice-modal-container" }, children)]
    );
  },
};

function NiceModalHoc(WrappedComponent) {
  return {
    name: "NiceModalHoc",
    inject: ["modals"],
    props: {
      id: String,
      ...WrappedComponent.props,
    },
    computed: {
      modalState() {
        return this.modals[this.id];
      },
      modalCtrlOrigin() {
        return {
          ...this.modalState,
          show: this.show,
          hide: this.hide,
          remove: this.remove,
          resolve: this.resolve,
          reject: this.reject,
          hideWithResolve: this.hideWithResolve,
          hideWithReject: this.hideWithReject,
        };
      },
      // routeKey() {
      //   router
      //   return router.currentRoute.fullPath;
      // }
    },
    methods: {
      show() {
        show(this.id, this.modalState.args);
      },
      hide() {
        hide(this.id);
      },
      remove() {
        remove(this.id);
      },
      resolve(args) {
        modalCallbacks[this.id]?.resolve(args);
        delete modalCallbacks[this.id];
      },
      hideWithResolve(args) {
        this.resolve(args);
        hide(this.id);
      },
      hideWithReject(args) {
        this.resolve(args);
        hide(this.id);
      },
      reject(args) {
        modalCallbacks[this.id]?.reject(args);
        delete modalCallbacks[this.id];
      },
    },
    mounted() {
      // this.show(this.modal.id);
      if (this.modalState.shouldMount && !this.modalState.visible) {
        this.show();
      }
    },
    render(vue2h) {
      const h = vue3H ? vue3H : vue2h;
      const slots = normalizeSlots(this);

      return h(
        WrappedComponent,
        {
          on: this.$listeners,
          props: {
            ...this.$props,
            modalCtrl: this.modalCtrlOrigin,
            ...this.modalState.args ?? {},
          },
          attrs: this.$attrs,
        },
        slots
      );
    },
  };
}

/** vant popup 适配器 */
export const vantPopupAdapter = (modalCtrl) => {
  return {
    props: {
      value: modalCtrl.visible,
      closeOnClickOverlay: false,
      closeOnPopstate: true,
    },
    on: {
      close: () => {
        modalCtrl.resolve();
        modalCtrl.hide();
        modalCtrl.remove();
      },
      closed: () => {
        // modalCtrl.remove();
      },
      ["click-overlay"]: () => {
        // modalCtrl.resolve();
        // modalCtrl.hide();
      },
    },
  };
};

/** elementDialog 适配器 */
export const elementDialogAdapter = (modalCtrl) => {
  return {
    props: {
      visible: modalCtrl.visible,
      closeOnClickModal: false,
    },
    on: {
      close: () => {
        modalCtrl.resolve();
        modalCtrl.hide();
        // modalCtrl.remove();
      },
      closed: () => {
        modalCtrl.remove();
      },
      ["click-overlay"]: () => {
        // modalCtrl.resolve();
        // modalCtrl.hide();
      },
    },
  };
};

/** elementPlusDialog 适配器 */
export const elementPlusDialogAdapter = (modalCtrl) => {
  return {
    props: {
      modelValue: modalCtrl.visible,
    },
    on: {
      close: () => {
        modalCtrl.resolve();
        modalCtrl.hide();
      },
      closed: () => {
        modalCtrl.remove();
      },
    },
  };
};

const NiceModal = {
  Provider,
  NiceModalHoc,
  show,
  hide,
};
export default NiceModal;
