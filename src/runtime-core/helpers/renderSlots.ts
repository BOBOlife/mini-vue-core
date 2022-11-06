import { createVNode } from '../vnode';

export function renderSlots(slots, name, props) {
  const slot = slots[name]

  if (slot) {
    // 作用域插槽时 slot => function
    if (typeof slot === "function") {
      return createVNode("div", {}, slot(props))
    }
  }
}