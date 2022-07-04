import { PublicInstanceProxyHandlers } from './componentPublicInstance';
export function createComponentInstance(vnode) {

  const component = {
    vnode,
    type: vnode.type,
    setupState: {}
  };

  return component;
}


export function setupComponent(instance) {
  // TODO
  // initProps
  // initSlots


  setupStatusfulComponent(instance);

}

function setupStatusfulComponent(instance: any) {
  const Component = instance.type;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;

  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // setup -> return  function or object

  // TODO function

  if (typeof setupResult === "object") {
    // 搞一个 setupState 存setup的返回对象 然后通过代理一个对象  查找key 是否在setupState 从而读出来
    instance.setupState = setupResult; // 世界线回归
  }

  finishComponentSetup(instance);

}
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  instance.render = Component.render;
}

