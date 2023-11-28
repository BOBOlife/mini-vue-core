import { getCurrentInstance } from "./component";
export function provide(key, value) {
  //存
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent.provides;

    // init 初始化的时侯 成链
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides); // 存成原型链
    }
    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    // in 可以遍历原型链
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
    }

    return defaultValue;
  }
}
