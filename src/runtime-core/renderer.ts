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
  const el = (vnode.el = document.createElement(vnode.type));
  const { children, props } = vnode;

  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
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

function mountComponent(initialVNode: any, container) {
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);

}
function setupRenderEffect(instance: any, initialVNode, container) {
  const { proxy } = instance;
  // render 返回的是一个h(...) 渲染函数 将它的this指向proxy对象 当调用this.xxx 相当于 proxy.xxx
  const subTree = instance.render.call(proxy); // 返回的是 h('div',{}, 'xxx') 这样的树

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
  //  在这里 获取 el
  initialVNode.el = subTree.el;
}



