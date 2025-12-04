// 【补充】导入 ShapeFlags - 用于标识节点类型的位标志（bit flags）
import { ShapeFlags } from "@mini-vue-core/shared";

// 【补充】Fragment 和 Text 是特殊的虚拟节点类型
// Fragment: 不会创建实际 DOM 节点，只渲染 children（类似 React.Fragment）
// Text: 文本节点类型
export const Fragment = Symbol("Fragment"); //<></>
export const Text = Symbol("Text");

// 【补充】导出别名，与 Vue 3 API 保持一致
export { createVNode as createElementVNode };

// 【补充】创建虚拟节点（VNode）- Vue 的核心数据结构
// VNode 是对真实 DOM 的抽象描述，包含了渲染所需的所有信息
// @param type - 节点类型：字符串（HTML 标签）、组件对象、Fragment、Text 等
// @param props - 节点属性：class、style、事件监听器等
// @param children - 子节点：字符串（文本）、数组（子节点列表）、对象（插槽）
export function createVNode(type, props?, children?) {
  const vnode = {
    type,                           // 【补充】节点类型
    props,                          // 【补充】节点属性
    children,                       // 【补充】子节点
    key: props && props.key,        // 【补充】用于 diff 算法优化的 key
    shapeFlag: getShapeFlag(type),  // 【补充】节点形状标志，用于快速判断节点类型
    el: null,                       // 【补充】对应的真实 DOM 元素，初始为 null，挂载后会赋值
  };

  // children
  // 【补充】根据 children 的类型，设置对应的 shapeFlag
  // 使用位运算（|=）组合多个标志，这样一个节点可以同时拥有多个特征
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;   // 【补充】文本子节点
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;  // 【补充】数组子节点
  }

  // 判定 是否时slots children
  // component + children object
  // 【补充】判断是否是插槽子节点：必须同时满足两个条件
  // 1. 是组件节点（STATEFUL_COMPONENT）
  // 2. children 是对象类型（插槽是以对象形式传递的，如 { default: () => h('div') }）
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;  // 【补充】插槽子节点
    }
  }

  return vnode;
}

// 【补充】创建文本虚拟节点 - 用于渲染纯文本内容
// 例如：createTextVNode('hello') 会创建一个文本节点
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

// 【补充】获取节点的形状标志 - 根据 type 判断是元素还是组件
// 使用位标志（bit flags）的好处：
// 1. 性能高：位运算比字符串比较快
// 2. 可组合：一个节点可以同时拥有多个标志（如 ELEMENT | TEXT_CHILDREN）
// 3. 内存省：用一个数字就能表示多个布尔值
function getShapeFlag(type) {
  // 【补充】如果 type 是字符串（如 'div'），则是普通 HTML 元素
  // 否则是组件（type 是组件对象）
  return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}
