import { NodeTypes } from "./ast";

/**
 * TagType 枚举类型，用于区分标签的解析阶段
 * Start: 解析开始标签（如 <div>）
 * End: 解析结束标签（如 </div>）
 */
const enum TagType {
  Start,
  End,
}

/**
 * baseParse 是解析函数的入口
 * 作用：将模板字符串解析成AST（抽象语法树）
 * 
 * 解析步骤：
 * 1. 创建解析器上下文（用来保存当前解析状态）
 * 2. 递归解析根节点下的所有子节点
 * 3. 包装成根节点返回
 * 
 * @param content - Vue模板字符串
 * @returns 返回AST根节点
 */
export function baseParse(content: string) {
  // 创建解析器上下文，保存剩余未解析的源代码
  const context = createParserContext(content);
  // 从根节点开始解析所有子节点
  return createRoot(parseChildren(context, []));
}

/**
 * parseChildren 函数递归解析当前层级下的所有子节点
 * 
 * 解析逻辑：
 * 1. 循环读取源代码，识别不同类型的模板语法
 * 2. 区分三种主要节点类型：插值表达式、元素节点、纯文本
 * 3. 持续解析直到遇到结束标签或源代码耗尽
 * 
 * @param context - 解析器上下文对象
 * @param ancestors - 祖先元素栈，用于追踪嵌套的元素结构
 * @returns 返回解析出的子节点数组
 */
function parseChildren(context, ancestors) {
  const nodes: any = [];

  // 循环解析，直到遇到结束条件（闭合标签或源代码结束）
  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    
    // 判断当前位置的内容类型
    if (s.startsWith("{{")) {
      // 情况1：检测到 {{ 开头，说明是插值表达式（如 {{ message }}）
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      // 情况2：检测到 < 开头，检查是否是标签
      if (/[a-z]/i.test(s[1])) {
        // 第二个字符是字母，说明是开始标签（如 <div>）
        node = parseElement(context, ancestors);
      }
    }
    
    // 如果上面都没有匹配到，则作为纯文本处理
    if (!node) {
      node = parseText(context);
    }
    
    nodes.push(node);
  }

  return nodes;
}

/**
 * isEnd 函数判断当前是否到达了解析结束的条件
 * 
 * 结束条件有两种：
 * 1. 遇到匹配的结束标签（如 </div>，且该标签在祖先栈中）
 * 2. 源代码已经全部消耗（s 为空字符串）
 * 
 * @param context - 解析器上下文
 * @param ancestors - 祖先元素栈
 * @returns true 表示应该结束当前层级的解析
 */
function isEnd(context, ancestors) {
  const s = context.source;
  
  // 检查是否遇到结束标签
  if (s.startsWith("</")) {
    // 从栈顶向下遍历（后进先出），查找是否有匹配的打开标签
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      // 如果结束标签与栈中某个元素匹配，则说明该元素的内容已解析完毕
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }
  
  // 如果源代码为空（!s 为 true），表示已经解析完所有内容
  return !s;
}

function parseText(context: any) {
  /**
   * parseText 函数解析纯文本节点
   * 
   * 解析思路：
   * 1. 找到下一个"特殊标记"（< 或 {{）的位置
   * 2. 这个位置之前的内容都是纯文本
   * 3. 如果找不到特殊标记，则剩余所有内容都是文本
   * 
   * @param context - 解析器上下文
   * @returns 返回文本节点对象
   */
  // 1. 确定文本的结束位置
  // 文本结束于 '<' 或 '{{' 出现的位置
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];

  // 遍历所有的"终止标记"，找到最近的一个
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    // 如果找到了该标记，且它出现在当前endIndex之前，更新endIndex
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  // 2. 提取文本内容并推进解析位置
  const content = parseTextData(context, endIndex);
  
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

/**
 * parseTextData 函数提取指定长度的文本数据
 * 
 * 作用：
 * 1. 从源代码中截取文本
 * 2. 更新解析位置（消耗已处理的文本）
 * 
 * @param context - 解析器上下文
 * @param length - 要提取的文本长度
 * @returns 返回提取的文本内容
 */
function parseTextData(context: any, length) {
  // 1. 从源代码开头截取指定长度的内容
  const content = context.source.slice(0, length);

  // 2. 推进解析位置（消耗已读取的文本）
  advanceBy(context, length);
  return content;
}

/**
 * parseElement 函数解析一个完整的元素节点
 * 
 * 解析流程（以 <div>content</div> 为例）：
 * 1. 解析开始标签 <div>
 * 2. 将该元素加入祖先栈（用于追踪嵌套关系）
 * 3. 递归解析该元素内的所有子节点
 * 4. 弹出祖先栈
 * 5. 解析结束标签 </div> 并验证标签匹配
 * 
 * @param context - 解析器上下文
 * @param ancestors - 祖先元素栈
 * @returns 返回完整的元素节点对象
 */
function parseElement(context: any, ancestors) {
  // 1. 解析开始标签（如 <div>）
  const element: any = parseTag(context, TagType.Start);
  
  // 2. 将当前元素压入祖先栈（用于嵌套元素的追踪）
  ancestors.push(element);
  
  // 3. 递归解析该元素的子节点
  // 解析会持续到遇到匹配的结束标签为止
  element.children = parseChildren(context, ancestors);
  
  // 4. 弹出祖先栈
  ancestors.pop();
  
  // 5. 解析并验证结束标签
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    // 如果没有找到匹配的结束标签，抛出错误
    throw new Error(`缺少结束标签:${element.tag}`);
  }
  
  return element;
}

/**
 * startsWithEndTagOpen 函数检查源代码是否以某个标签的结束标签开头
 * 
 * 作用：判断当前位置是否是指定标签的结束标签
 * 例如：检查 \"</div>\" 是否是 \"div\" 的结束标签
 * 
 * @param source - 源代码字符串
 * @param tag - 标签名称
 * @returns true 表示源代码以该标签的结束标签开头
 */
function startsWithEndTagOpen(source, tag) {
  // 检查两个条件：
  // 1. source 以 \"</\" 开头
  // 2. 紧跟在 \"</\" 后面的标签名（不区分大小写）与参数 tag 相同
  return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}

/**
 * parseTag 函数解析HTML标签的开始或结束部分
 * 
 * 解析逻辑（以 <div> 为例）：
 * 1. 使用正则表达式提取标签名：<div> 或 </div> 中的 \"div\"
 * 2. 消耗 \"<div\" 部分（正则匹配的内容）
 * 3. 消耗 \">\" 字符
 * 4. 对于开始标签，返回元素对象；对于结束标签，仅做消耗处理
 * 
 * @param context - 解析器上下文
 * @param type - 标签类型（开始标签或结束标签）
 * @returns 对于开始标签返回元素对象，对于结束标签返回 undefined
 */
function parseTag(context: any, type: TagType) {
  // 正则表达式说明：
  // ^<\\/?    - 匹配 \"<\" 或 \"</\" 开头
  // ([a-z]*)  - 捕获标签名（一个或多个字母）
  // /i        - 不区分大小写
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  
  // 1. 消耗 \"<div\" 或 \"</div\" 部分
  advanceBy(context, match[0].length);
  
  // 2. 消耗 \">\" 字符
  advanceBy(context, 1);

  // 对于结束标签，仅消耗内容，不返回任何值
  if (type === TagType.End) return;

  // 对于开始标签，返回元素节点对象
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

/**
 * parseInterpolation 函数解析插值表达式（模板语法）
 * 
 * 解析过程（以 {{ message }} 为例）：
 * 1. 确定 }}（闭合分隔符）的位置
 * 2. 消耗开启分隔符 {{
 * 3. 提取分隔符之间的内容
 * 4. 去除内容两端的空格
 * 5. 消耗闭合分隔符 }}
 * 6. 返回插值节点对象
 * 
 * @param context - 解析器上下文
 * @returns 返回插值表达式节点对象
 */
function parseInterpolation(context) {
  // 定义分隔符
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  // 1. 从 {{ 之后开始查找 }} 的位置
  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);

  // 2. 消耗开启分隔符 {{
  advanceBy(context, openDelimiter.length);

  // 3. 计算插值内容的长度
  // closeIndex 是 }} 在原字符串中的位置
  // 减去 {{ 的长度，得到插值内容部分在当前 source 中的长度
  const rawContentLength = closeIndex - openDelimiter.length;

  // 4. 提取原始内容并推进解析位置
  const rawContent = parseTextData(context, rawContentLength);
  
  // 5. 去除内容两端的空格（如 \" message \" 变为 \"message\"）
  const content = rawContent.trim();

  // 6. 消耗闭合分隔符 }}
  advanceBy(context, closeDelimiter.length);
  
  // 返回插值表达式节点
  // content 字段包装为 SIMPLE_EXPRESSION 类型，用于后续编译阶段处理
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

/**
 * advanceBy 函数推进解析位置
 * 
 * 作用：
 * 每次解析完一段内容后，需要从源代码中删除已处理的部分
 * 这样下一次解析就从新的位置开始
 * 
 * 例如：原 source=\"<div>\"，调用 advanceBy(context, 1) 后，
 *      source=\"div>\"（\"<\" 被消耗掉了）
 * 
 * @param context - 解析器上下文
 * @param length - 要消耗的字符数
 */
function advanceBy(context: any, length: number) {
  // 从源代码中截取，保留第 length 个字符之后的所有内容
  context.source = context.source.slice(length);
}

/**
 * createRoot 函数创建AST的根节点
 * 
 * @param children - 根节点下的所有子节点
 * @returns 返回AST根节点对象
 */
function createRoot(children) {
  return {
    children,
    type: NodeTypes.ROOT,
  };
}

/**
 * createParserContext 函数创建解析器的上下文对象
 * 
 * 作用：初始化解析状态，source 字段保存未处理的模板代码
 * 随着解析进行，source 会不断被消耗（通过 advanceBy 函数）
 * 
 * @param content - 完整的模板字符串
 * @returns 返回解析器上下文对象
 */
function createParserContext(content: string): any {
  return {
    // source 保存当前未处理的源代码
    // 初始值是完整的模板字符串
    // 每处理完一部分，就通过 advanceBy 从前面削减
    source: content,
  };
}
