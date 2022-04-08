import { extend } from "../shared";

let activeEffect;
let shouldTrack;

class ReactiveEffect {
  private _fn: any;
  deps = [];
  active: boolean = true;
  onStop?: () => void;
  public scheduler: Function | undefined;

  constructor(fn, scheduler?: Function) {
    this._fn = fn;
  }
  run() {

    // 1.  会收集依赖
    // 2. shouldTrack 来做区分
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    activeEffect = this;

    const result = this._fn();
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

const targetMap = new Map();

export function track(target, key) {
  if (!isTracking()) return;

  // target ->  key ->  dep
  let depsMap = targetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);

  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  // 如果已经在 dep 中 不用重复添加
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  // fn
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}