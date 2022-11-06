import { createVNode, Fragment } from '../vnode';

export function renderSlots(slots, name, props) {
  const slot = slots[name]

  if (slot) {
    // 作用域插槽时 slot => function
    if (typeof slot === "function") {
      // children 不可以有array 所以用 'div' 包了一层
      // 需要 搞一个 fragment 
      return createVNode(Fragment, {}, slot(props))
    }
  }
}