import { extend } from "@mini-vue-core/shared";

let activeEffect;
let shouldTrack;

export class ReactiveEffect {
  private _fn: any;
  deps = [];
  active: boolean = true;
  onStop?: () => void;
  public scheduler: Function | undefined;

  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 1.  会收集依赖
    // 2. shouldTrack 来做区分
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    activeEffect = this;

    const result = this._fn(); // 执行副作用函数 计算属性计算结果
    // reset
    shouldTrack = false;
    return result;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}
// 副作用函数的注册
export function effect(fn, options: any = {}) {
  // fn
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect); // 这个返回了一个
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

/********************* 以下依赖收集 ***************************/
const targetMap = new WeakMap(); // 使用弱引用 避免内存泄漏

export function track(target, key) {
  if (!isTracking()) return;

  // target ->  key ->  dep

  //  类似于 targetMap = {target: depsMap}
  //  类似于 depsMap  = { key: dep }
  let depsMap = targetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);

  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep); // 对象的key 和 对应的effect依赖集合
  }
  trackEffects(dep); // 收集副作用effect 函数
}
export function trackEffects(dep) {
  // 如果已经在 dep 中 不用重复添加
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep); // effect 记录它被哪些 dep 收集了，反向记录是为了实现stop
}
export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
/*************** 以下触发依赖 ******************/
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let deps = depsMap.get(key);
  triggerEffects(deps);
}

// 事例
// const set = new Set();
// set.forEach((item) => {
//   set.delete(1);
//   set.add(1);
//   console.log("遍历中");
// });
// 在调用forEach 遍历Set集合时，如果一个值已经被访问了， 该值被删除重新添加到集合，如果此时的forEach遍历没有结束，那么该值会被重新访问，上面代码会无限执行
// 因为Set是基于迭代器（Iterator）的数据结构 在遍历过程中对集合进行修改会破坏迭代器的状态，从而导致无限循环或遗漏某些元素.
// 如果在遍历Set集合时删除和重新添加值，可以考虑将Set转换成数组，在数组上操作，最后再将数组转换回Set
export function triggerEffects(deps) {
  //防止无限循环执行 复制一个deps 来遍历调用
  const effectToRun = new Set();
  deps &&
    deps.forEach((effectFn) => {
      // 避免无限递归循环  具体原因看上面解释
      // if (effectFn !== activeEffect) {
      effectToRun.add(effectFn);
      // }
    });

  effectToRun.forEach((effectFn: any) => {
    if (effectFn.scheduler) {
      effectFn.scheduler();
    } else {
      effectFn.run(); //run 就是的执行副作用函数
    }
  });
  // for (const effect of deps) {
  //   console.log(effect);
  //   if (effect.scheduler) {
  //     effect.scheduler();
  //   } else {
  //     effect.run(); //run 就是的执行副作用函数
  //   }
  // }
}
