import { effect } from "@mini-vue-core/reactivity/src/effect";
import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags, EMPTY_OBJECT } from "@mini-vue-core/shared";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { queueJobs } from "./scheduler";

//创建一个自定义渲染器。通过提供平台特定的节点创建以及更改 API，你可以在非 DOM 环境中也享受到 Vue 核心运行时的特性。
// 【补充】这是 Vue 跨平台能力的核心：options 参数包含了所有平台相关的 DOM 操作
// 浏览器环境传入 document.createElement、appendChild 等
// 小程序/原生环境可以传入对应平台的 API，实现一套代码多端运行
export function createRenderer(options) {
  // 【补充】解构出平台相关的操作方法，使用 host 前缀命名以区分平台无关的逻辑
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode, container) {
    // 调用patch
    patch(null, vnode, container, null, null);
  }

  // n1  n2 n1老的虚拟节点 n2 新的虚拟节点
  // 使用n1 和 n2 进行判断是初始化 还是 更新
  function patch(n1, n2, container, parentComponent, anchor) {
    //处理组件
    // 判断类型 是不是element类型
    const { type, shapeFlag } = n2;

    // Fragment -> 只渲染children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  // 【补充】处理文本节点：创建文本 DOM 节点并挂载到 vnode.el 上
  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  // 【补充】Fragment 不会创建实际的 DOM 节点，只渲染它的 children
  function processFragment(n1, n2: any, container: any, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      // init
      mountElement(n2, container, parentComponent, anchor);
    } else {
      // update
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  // 【补充】更新元素节点：对比新旧节点的 props 和 children
  function patchElement(n1, n2, container, parentComponent, anchor) {
    // TODO
    console.log("patchElement");
    console.log("n1:", n1, "\n", "n2:", n2);
    const oldProps = n1.props || EMPTY_OBJECT;
    const newProps = n2.props || EMPTY_OBJECT;
    const el = (n2.el = n1.el); // 【补充】复用旧节点的真实 DOM 元素
    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  // 【补充】更新子节点 - 处理 4 种情况：文本->文本、文本->数组、数组->文本、数组->数组
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1.把老的children清空
        unmountChildren(n1.children);
      }
      if (c1 !== c2) {
        // 2.设置text
        hostSetElementText(container, c2);
      }
    } else {
      // new array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  // 【补充】diff 算法核心 - Vue 3 的双端 + 最长递增子序列优化
  // 算法步骤：1.左侧对比 2.右侧对比 3.处理新增/删除 4.中间乱序部分用最长递增子序列优化
  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    const l2 = c2.length;
    let i = 0; // 【补充】左侧指针
    let e1 = c1.length - 1; // 【补充】旧数组右侧指针
    let e2 = l2 - 1; // 【补充】新数组右侧指针

    const isSomeVNodeType = (n1, n2) => n1.type === n2.type && n1.key === n2.key; // 【补充】判断两个节点是否相同（type 和 key 都相同）
    // 左侧缩小范围
    // 【补充】例如: [a, b, c] vs [a, b, d, e] -> 对比后 i=2，相同的 a,b 已处理
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break; // 【补充】遇到不同的节点，停止左侧对比
      }
      i++;
    }

    // 右侧缩小范围
    // 【补充】例如: [a, b, c] vs [d, e, b, c] -> 对比后 e1=0, e2=1，相同的 b,c 已处理
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    //新的比老的多 创建新的
    // 【补充】例如: [a, b] -> [a, b, c] 或 [a, b] -> [c, a, b]
    if (i > e1) {
      if (i <= e2) {
        const nextPosition = e2 + 1;
        const anchor = nextPosition < l2 ? c2[nextPosition].el : null; // 【补充】计算插入位置的锚点
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor); // 【补充】挂载所有新增的节点
          i++;
        }
      }
    } else if (i > e2) {
      // 新的比老的少 要删除
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      ///******************************************* */
      // 【补充】最复杂的情况：中间乱序部分，例如 [a,b,c,d,e,f,g] -> [a,b,e,c,d,h,f,g]
      let s1 = i; // 【补充】旧数组中间部分的起始位置
      let s2 = i; // 【补充】新数组中间部分的起始位置
      const toBePatched = e2 - s2 + 1; // 【补充】需要处理的新节点数量
      let patched = 0; // 【补充】已经处理的节点数量
      const keyToNewIndexMap = new Map(); // 【补充】建立 key -> index 的映射表，用于快速查找（O(1)）
      const newIndexToOldIndexMap = new Array(toBePatched); // 性能 // 【补充】新索引 -> 旧索引的映射，0 表示新节点需要创建
      let moved = false; // 【补充】是否需要移动节点
      let maxNewIndexSoFar = 0; // 【补充】记录遍历过程中最大的新索引，用于判断是否需要移动
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0; // 【补充】初始化为 0

      // 【补充】第一步：建立新节点的 key -> index 映射表
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      // 【补充】第二步：遍历旧节点，找到可复用的节点并 patch
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          hostRemove(prevChild.el); // 【补充】优化：已处理数量够了，剩余的都删除
          continue;
        }

        let newIndex; // 【补充】旧节点在新数组中的位置
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key); // 【补充】有 key，O(1) 查找
        } else {
          // 【补充】没有 key，只能 O(n) 遍历查找 - 这就是为什么要加 key！
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === undefined) {
          hostRemove(prevChild.el); // 【补充】在新数组中找不到，删除
        } else {
          // 【补充】判断是否需要移动：如果新索引一直递增则不需要移动，出现回退则需要移动
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true; // 【补充】新索引回退了，标记需要移动
          }

          newIndexToOldIndexMap[newIndex - s2] = i + 1; // 【补充】记录映射关系（+1 避免 i=0 的情况）

          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      // 【补充】第三步：获取最长递增子序列，优化移动操作
      // 最长递增子序列中的节点不需要移动，只移动其他节点，最小化 DOM 操作
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;

      // 【补充】第四步：从后向前遍历，创建新节点或移动节点（从后向前保证插入位置稳定）
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor); // 【补充】值为 0 表示新节点，需要创建
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor); // 【补充】不在最长递增子序列中，需要移动
          } else {
            j--; // 【补充】在最长递增子序列中，不需要移动
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // remove old children
      hostRemove(el);
    }
  }
  // 【补充】更新属性：处理新属性的更新和旧属性的删除
  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // 【补充】遍历新属性，更新变化的属性
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) {
          // 新老prop 不相同的时候 要更新
          hostPatchProp(el, key, oldProps, nextProp);
        }
      }
      // 【补充】遍历旧属性，删除不存在于新属性中的属性
      if (oldProps !== EMPTY_OBJECT) {
        for (const key in oldProps) {
          if (!Object.prototype.hasOwnProperty.call(newProps, key)) {
            hostPatchProp(el, key, oldProps[key], null); // 【补充】传 null 表示删除该属性
          }
        }
      }
    }
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  // 【补充】更新组件：判断是否需要更新，需要则触发 update（effect 返回的 runner）
  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component); // 【补充】复用组件实例
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2; // 【补充】保存新的 vnode
      instance.update(); // 【补充】触发更新（这个 update 是 effect 返回的 runner 函数）
    } else {
      n2.el = n1.el; // 【补充】不需要更新，只更新 vnode 引用
      instance.vnode = n2;
    }
  }

  // 【补充】挂载元素节点：创建 DOM -> 处理子节点 -> 处理属性 -> 插入容器
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type)); // 【补充】创建真实 DOM 并保存到 vnode.el
    // console.log(vnode.type);
    const { children, props, shapeFlag } = vnode;

    // children

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children; // 【补充】文本子节点
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor); // 【补充】数组子节点
    }

    // 【补充】处理属性（包括事件监听器）
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }
    hostInsert(el, container, anchor); // 【补充】插入到容器中
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  // 【补充】挂载组件：创建实例 -> 设置组件（props/slots/setup） -> 设置渲染副作用
  function mountComponent(initialVNode: any, container, parentComponent, anchor) {
    const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent)); // 【补充】创建组件实例

    setupComponent(instance); // 【补充】设置组件（处理 props、slots、执行 setup）
    setupRenderEffect(instance, initialVNode, container, anchor); // 【补充】设置渲染副作用（响应式更新的核心）
  }
  // 【补充】设置渲染副作用 - 组件响应式更新的核心
  // 使用 effect 包裹 render 函数，当依赖的响应式数据变化时，自动重新执行
  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    instance.update = effect( // 【补充】将 effect 返回的 runner 保存到 instance.update，可手动触发更新
      () => {
        // 分初始化和更新
        if (!instance.isMounted) {
          // 【补充】========== 初始化渲染 ==========
          console.log("init");
          const { proxy } = instance;
          // render 返回的是一个h(...) 渲染函数 将它的this指向proxy对象 当调用this.xxx 相当于 proxy.xxx
          const subTree = (instance.subTree = instance.render.call(proxy, proxy)); // 返回的是 h('div',{}, 'xxx') 这样的树
          // console.log("subtree:init", subTree);
          // vnode -> patch
          // vnode -> element -> mountElement
          patch(null, subTree, container, instance, anchor);
          //  在这里 获取 el
          initialVNode.el = subTree.el; // 【补充】将根元素的 el 赋值给组件 vnode，可通过组件 vnode 访问真实 DOM
          instance.isMounted = true;
        } else {
          // 【补充】========== 更新渲染 ==========
          console.log("update");
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el; // 【补充】next 存在表示组件自身更新（props 变化等）

            updateComponentPreRender(instance, next); // 【补充】更新组件的 props 等
          }
          const { proxy } = instance;
          const subTree = instance.render.call(proxy, proxy); // 返回的是 h('div',{}, 'xxx') 这样的树
          const preSubTree = instance.subTree;
          // console.log("subtree:update", subTree, preSubTree);
          instance.subTree = subTree;
          patch(preSubTree, subTree, container, instance, anchor); // 【补充】对比新旧虚拟节点树，更新视图
        }
      },
      {
        // 视图异步更新
        // 【补充】scheduler 调度器 - 实现异步更新，合并多次数据变化，只执行一次更新，提高性能
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
  }
  return {
    createApp: createAppAPI(render),
  };
}

// 【补充】更新组件的 props 等信息，在组件自身更新时调用（如父组件传递的 props 变化）
function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode;
  instance.next = null;

  instance.props = nextVNode.props;
}

// 【补充】获取最长递增子序列 - diff 算法的优化核心
// 作用：找到数组中最长递增子序列的索引，这些节点不需要移动，只移动其他节点
// 例如：[2, 3, 1, 5, 6, 8, 7, 9, 4] -> 最长递增子序列 [2, 3, 5, 6, 8, 9] -> 返回索引 [0, 1, 3, 4, 5, 7]
// 算法：贪心 + 二分查找，时间复杂度 O(n log n)
function getSequence(arr) {
  const p = arr.slice(); // 【补充】用于记录前驱节点
  const result = [0]; // 【补充】存储最长递增子序列的索引
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j; // 【补充】当前值大于结果序列的最后一个值，直接追加，记录前驱
        result.push(i);
        continue;
      }
      // 【补充】二分查找，找到第一个大于等于 arrI 的位置
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1; // 【补充】相当于 Math.floor((u + v) / 2)
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]; // 【补充】记录前驱节点
        }
        result[u] = i; // 【补充】如果找到更小的值，替换
      }
    }
  }
  // 【补充】回溯，构建最终的递增子序列
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
