import { createVNode } from "./vnode";

export function createApp(rootComponent) {


  return {
    mount(rootContainer) {
      // 先转化成虚拟节点 Vnode
      // component 转化成 Vnode
      // 此后的操作都是围绕 Vnode 来做
      const Vnode = createVNode(rootComponent);


    }
  };
}