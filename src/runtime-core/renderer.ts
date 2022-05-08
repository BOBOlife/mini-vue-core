import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用patch
  patch(vnode, container);
}


function patch(vnode, container) {

  //处理组件

  // 判断类型 是不是element类型




  processComponent(vnode, container);

}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);

}
function setupRenderEffect(instance: any, container) {
  const subTree = instance.render(); // 返回的是 h('div',{}, 'xxx') 这样的树

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(instance, container);
}

