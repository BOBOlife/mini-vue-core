// 【补充】导入响应式相关工具：proxyRefs 用于自动解包 ref，shallowReadonly 用于只读 props
import { proxyRefs, shallowReadonly } from "@mini-vue-core/reactivity";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { emit } from "./componentEmit";
import { initSlots } from "./componentSlots";

// 【补充】创建组件实例 - 组件的核心数据结构
// 这个函数会为每个组件创建一个实例对象，包含组件运行所需的所有状态和方法
export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,                // 【补充】组件的虚拟节点
    type: vnode.type,     // 【补充】组件的定义对象（包含 setup、render 等）
    next: null,           // 【补充】下一个要更新的 vnode，用于组件更新时
    setupState: {},       // 【补充】setup 函数返回的状态对象
    props: {},            // 【补充】组件的 props
    slots: {},            // 【补充】组件的插槽内容
    provides: parent ? parent.provides : {}, // 【补充】依赖注入：继承父组件的 provides
    parent,               // 【补充】父组件实例，用于组件树的层级关系
    isMounted: false,     // 【补充】是否已挂载的标志
    subTree: {},          // 【补充】组件 render 函数返回的虚拟节点树
    emit: () => {},       // 【补充】事件触发函数，稍后会绑定
  };

  // 【补充】绑定 emit 函数，第一个参数固定为当前组件实例
  // 这样在组件中调用 emit('event') 时，emit 函数内部就能知道是哪个组件触发的事件
  component.emit = emit.bind(null, component) as any;

  return component;
}

// 【补充】设置组件 - 初始化组件的各个部分
// 这是组件初始化的入口函数，按顺序处理 props、slots 和 setup
export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);      // 【补充】初始化 props，将 vnode 上的 props 设置到组件实例
  initSlots(instance, instance.vnode.children);   // 【补充】初始化 slots，处理组件的插槽内容

  setupStatusfulComponent(instance);              // 【补充】设置有状态组件（执行 setup 函数）
}

// 【补充】设置有状态组件 - 处理组件的 setup 函数和 render 函数
function setupStatusfulComponent(instance: any) {
  const Component = instance.type; // 【补充】获取组件定义对象

  // 【补充】创建组件实例的代理对象，用于在 render 函数中通过 this 访问 props、setupState 等
  // PublicInstanceProxyHandlers 定义了访问规则，例如 this.xxx 会依次从 setupState、props、$el 等查找
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;

  if (setup) {
    // 【补充】设置当前实例，这样在 setup 中调用 getCurrentInstance() 就能获取到当前组件实例
    setCurrentInstance(instance);
    // 【补充】执行 setup 函数，传入只读的 props 和 emit 等上下文
    // shallowReadonly 确保 props 不能被修改（单向数据流）
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
    // 【补充】setup 执行完后清空当前实例，避免在 setup 外部调用 getCurrentInstance()
    setCurrentInstance(null);

    handleSetupResult(instance, setupResult); // 【补充】处理 setup 的返回值
  }
}

// 【补充】处理 setup 函数的返回值
// setup 可以返回对象（状态）或函数（render 函数）
function handleSetupResult(instance, setupResult: any) {
  // setup -> return  function or object

  // TODO function
  // 【补充】如果 setup 返回函数，应该作为组件的 render 函数（目前未实现）

  if (typeof setupResult === "object") {
    // 搞一个 setupState 存setup的返回对象 然后通过代理一个对象  查找key 是否在setupState 从而读出来
    // 【补充】proxyRefs 会自动解包 ref，这样在模板中访问 ref 时不需要 .value
    // 例如：setup 返回 { count: ref(0) }，在模板中可以直接用 {{ count }} 而不是 {{ count.value }}
    instance.setupState = proxyRefs(setupResult); // 世界线回归
  }

  finishComponentSetup(instance); // 【补充】完成组件设置，处理 render 函数
}
// 【补充】完成组件设置 - 确保组件有 render 函数
function finishComponentSetup(instance: any) {
  const Component = instance.type;

  // 【补充】如果有编译器且组件没有 render 函数，则编译 template 生成 render 函数
  // 这是运行时编译的逻辑：template -> compiler -> render 函数
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }

  // 【补充】将 render 函数挂载到组件实例上，后续渲染时会调用这个函数
  instance.render = Component.render;
}

// 【补充】全局变量，保存当前正在执行 setup 的组件实例
let currentInstance = null;

// 【补充】获取当前组件实例 - 只能在 setup 或生命周期钩子中调用
// 这是 Composition API 的核心机制，让 composable 函数能访问到组件实例
export function getCurrentInstance() {
  return currentInstance;
}

// 【补充】设置当前组件实例（内部使用）
// 在 setup 执行前设置，执行后清空，确保 getCurrentInstance 只在正确的时机有效
function setCurrentInstance(instance) {
  currentInstance = instance;
}

// 【补充】编译器变量，用于运行时编译 template
let compiler;

// 【补充】注册运行时编译器 - 实现运行时编译能力
// 在完整版 Vue 中，会调用这个函数注册编译器，让组件可以使用 template 而不是 render 函数
// 这是 Vue 模块化设计的体现：runtime-core 不包含编译器，由外部注入
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
