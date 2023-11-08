import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 先转化成虚拟节点 Vnode
        // component 转化成 Vnode
        // 此后的操作都是围绕 Vnode 来做
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
      },
    };
  };
}
