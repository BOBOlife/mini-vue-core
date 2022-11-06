export const enum ShapeFlags {
  ELEMENT = 1, // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000 
  SLOT_CHILDREN = 1 << 4
}
// 之前这种方式
// ShapeFlags.stateful_component = 1

// 使用位运算
//  ｜ 两位为0，才为0
//  &  两位为1 ，才为1

// 修改  ｜
// 0000
// 0001
//——————
// 0001

// 查找 &
// 0001
// 0001
// ——————
// 0001