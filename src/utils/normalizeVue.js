export function normalizeProps(vm) {
  return {
    on: vm.$listeners,
    attr: vm.$attrs,
    scopedSlots: vm.$scopedSlots
  };
}

export function normalizeSlots(vm) {
  const slots = Object.keys(vm.$slots)
    .reduce((arr, key) => arr.concat(this.$slots[key]), [])
    // 手动更正 context
    .map((vnode) => {
      vnode.context = this._self;
      return vnode;
    });

  return slots;
}
