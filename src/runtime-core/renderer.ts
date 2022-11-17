import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from '../shared/ShapeFlags';
import { createAppAPI } from "./createApp";
import { Fragment, Text } from './vnode';


export function createRenderer(options) {
  const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options

  function render(vnode, container) {
    // 调用patch
    patch(vnode, container, null);
  }


  function patch(vnode, container, parentComponent) {
    //处理组件
    // 判断类型 是不是element类型
    const { type, shapeFlag } = vnode;

    // Fragment -> 只渲染children 
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent)
        break;
      case Text:
        processText(vnode, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }
  function processText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
  }


  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent)

  }

  function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
  }

  function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    console.log(vnode.type)
    const { children, props, shapeFlag } = vnode;

    // children

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, val)
    }
    hostInsert(el, container)
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(v => {
      patch(v, container, parentComponent);
    });
  }

  function mountComponent(initialVNode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);

  }
  function setupRenderEffect(instance: any, initialVNode, container) {
    const { proxy } = instance;
    // render 返回的是一个h(...) 渲染函数 将它的this指向proxy对象 当调用this.xxx 相当于 proxy.xxx
    const subTree = instance.render.call(proxy); // 返回的是 h('div',{}, 'xxx') 这样的树

    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container, instance);
    //  在这里 获取 el
    initialVNode.el = subTree.el;
  }
  return {
    createApp: createAppAPI(render)
  }
}

