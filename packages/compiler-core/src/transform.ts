import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

/**
 * transform 函数是编译的第二阶段（AST转换）
 * 功能：将解析出来的AST通过各种转换函数进行处理和优化
 * 流程：
 * 1. 创建转换上下文（context）来保存转换状态和辅助信息
 * 2. 递归遍历AST节点，执行各种转换函数
 * 3. 为根节点生成代码生成信息
 * 4. 收集整个AST中用到的运行时辅助函数
 */
export function transform(root, options = {}) {
  // 1. 创建转换上下文，用来保存转换过程中的信息（如节点转换函数、收集的辅助函数）
  const context = createTransformContext(root, options);
  
  // 2. 从根节点开始递归遍历整个AST树，对每个节点执行转换
  traverseNode(root, context);
  
  // 3. 为根节点生成代码生成所需的信息
  createRootCodegen(root);

  // 4. 将收集到的所有运行时辅助函数保存到root.helpers中
  // 这些辅助函数会在生成代码时被导入使用（如 _toDisplayString, _createElementVNode 等）
  root.helpers = [...context.helpers.keys()];
}

/**
 * createRootCodegen 函数为根节点配置代码生成信息
 * 作用：将根节点的代码生成信息设置为其第一个子节点的代码生成信息
 * 这样可以简化后续代码生成阶段的处理逻辑
 */
function createRootCodegen(root: any) {
  const child = root.children[0];
  
  // 如果第一个子节点是元素节点（如 <div>），直接使用其codegenNode
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    // 否则直接使用该子节点作为root的代码生成节点（如文本节点、插值节点等）
    root.codegenNode = root.children[0];
  }
}

/**
 * createTransformContext 函数创建转换上下文对象
 * 作用：初始化并返回一个上下文对象，在AST遍历过程中传递和维护转换的状态
 * 
 * @param root - AST根节点
 * @param options - 配置选项，包含用户自定义的节点转换函数
 * @returns 返回包含转换信息的上下文对象
 */
function createTransformContext(root: any, options: any): any {
  const context = {
    // 保存AST根节点的引用
    root,
    
    // 存储由用户提供的节点转换函数数组
    // 每个函数都会在遍历节点时被调用，用来转换特定类型的节点
    nodeTransforms: options.nodeTransforms || [],

    // 用Map数据结构收集整个AST中用到的所有运行时辅助函数
    // 例如：_toDisplayString（用于插值表达式）、_createElementVNode（用于创建元素）等
    helpers: new Map(),
    
    // 辅助函数：用来记录某个辅助函数被使用过
    // 调用时会将该函数名作为key添加到helpers Map中
    helper(key) {
      context.helpers.set(key, 1);
    },
  };

  return context;
}

/**
 * traverseNode 函数递归遍历单个节点，并执行相应的转换逻辑
 * 采用深度优先遍历方式，并支持"进入"和"退出"两个阶段的转换
 * 
 * 遍历流程：
 * 1. 执行所有节点转换函数的"进入"阶段
 * 2. 根据节点类型进行特定处理（如递归遍历子节点）
 * 3. 逆序执行所有节点转换函数的"退出"阶段
 */
function traverseNode(node: any, context) {
  const nodeTransforms = context.nodeTransforms;
  
  // 1. 收集所有的"退出"回调函数
  // 每个转换函数在进入阶段可以返回一个退出回调，用于后序处理
  const exitFns: any = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    // 调用转换函数，传入节点和上下文，获得退出阶段的回调函数
    const onExit = transform(node, context);
    if (onExit) exitFns.push(onExit);
  }

  // 2. 根据不同的节点类型进行处理
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // 对于插值节点（如 {{ message }}），需要标记使用 TO_DISPLAY_STRING 辅助函数
      // 这个函数在运行时用于将值转换为可显示的字符串
      context.helper(TO_DISPLAY_STRING);
      break;
      
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      // 对于根节点和元素节点，递归遍历其所有子节点
      traverseChildren(node, context);
      break;

    default:
      break;
  }

  // 3. 逆序执行所有的退出回调函数
  // 这确保了子节点的退出阶段在父节点之前完成（后进先出）
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

/**
 * traverseChildren 函数用于遍历节点的所有子节点
 * 这是一个简单的辅助函数，遍历children数组中的每个子节点
 * 
 * @param node - 当前节点
 * @param context - 转换上下文对象
 */
function traverseChildren(node: any, context: any) {
  const children = node.children;

  // 遍历所有子节点，对每个子节点递归调用 traverseNode
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    // 递归遍历子节点
    traverseNode(node, context);
  }
}
