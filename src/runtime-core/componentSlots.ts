import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance, children) {
  //  可能children 不是slots 这种情况 所以用flag 判断一下节点
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    if (Object.prototype.hasOwnProperty.call(children, key)) {
      const value = children[key];
      //slot
      slots[key] = (props) => normalizeSlotsValue(value(props));
    }
  }
}

function normalizeSlotsValue(value) {
  return Array.isArray(value) ? value : [value];
}
