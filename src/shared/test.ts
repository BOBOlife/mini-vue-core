const ShapeFlags = {
  element: 0,
  stateful_component: 0,
  text_children: 0,
  array_children: 0
};

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




