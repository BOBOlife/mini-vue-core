import { createComponentInstance, setupComponent } from "./component";
import { isObject } from '../shared/index';

export function render(vnode, container) {
  // 调用patch
  patch(vnode, container);
}


function patch(vnode, container) {
  //处理组件
  // 判断类型 是不是element类型

  console.log(vnode);
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}
function processElement(vnode, container) {
  mountElement(vnode, container);
}
function processComponent(vnode, container) {
  mountComponent(vnode, container);
}
function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);
  const { children, props } = vnode;

  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, container);
  }

  // string  array
  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach(v => {
    patch(v, container);
  });
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
  patch(subTree, container);
}



