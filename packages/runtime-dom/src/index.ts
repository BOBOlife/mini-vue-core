import { createRenderer } from "@mini-vue-core/runtime-core";

function createElement(type) {
  return document.createElement(type);
}

// props 对象注册事件和注册属性
function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // 注册事件 包括自定义的事件
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}
// anchor 锚点 插入这个节点位置  （之前）
function insert(child, parent, anchor) {
  parent.insertBefore(child, anchor || null);
  // parent.append(el);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}
function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "@mini-vue-core/runtime-core";
