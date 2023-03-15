import { effect } from "../reactivity/effect";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;

  function render(vnode, container) {
    // 调用patch
    patch(null, vnode, container, null);
  }

  // n1  n2
  function patch(n1, n2, container, parentComponent) {
    //处理组件
    // 判断类型 是不是element类型
    const { type, shapeFlag } = n2;

    // Fragment -> 只渲染children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }
  function processText(n1, vnode: any, container: any) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }

  function processElement(n1, n2, container, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1, n2, container) {
    // TODO
    console.log("patchElement");
    console.log("n1:", n1, "n2", n2);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
  }

  function patchProps(el, oldProps, newProps) {
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      if (prevProp !== nextProp) {
        hostPatchProp(el, key, oldProps, newProps);
      }
    }
  }

  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    console.log(vnode.type);
    const { children, props, shapeFlag } = vnode;

    // children

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, val);
    }
    hostInsert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }

  function mountComponent(initialVNode: any, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }
  function setupRenderEffect(instance: any, initialVNode, container) {
    effect(() => {
      // 分初始化和更新
      if (!instance.isMounted) {
        console.log("init");
        const { proxy } = instance;
        // render 返回的是一个h(...) 渲染函数 将它的this指向proxy对象 当调用this.xxx 相当于 proxy.xxx
        const subTree = (instance.subTree = instance.render.call(proxy)); // 返回的是 h('div',{}, 'xxx') 这样的树
        // vnode -> patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance);
        //  在这里 获取 el
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy)); // 返回的是 h('div',{}, 'xxx') 这样的树
        const preSubTree = instance.subTree;
        instance.subTree = subTree;
        patch(preSubTree, subTree, container, instance);
      }
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}
