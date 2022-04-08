import { reactive } from '../reactive';
import { effect, stop } from '../effect';

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  it(' should return runner when call effect', () => {

    // effect(fn) -> function (runner) -> fn -> return

    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });

  it('scheduler', () => {
    // 1. 通过 effect 的第二个参数给定的 一个 scheduler 的 fn
    // 2. effect 第一次执行的时候 还会执行 fn
    // 3. 当 响应式对象set update 的时候 不会执行 fn 而是执行 scheduler
    // 4. 如果当执行 runner 的时候， 会再次执行 fn

    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(() => {
      dummy = obj.foo;
    }, { scheduler });
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);

    // should not run yet
    expect(dummy).toBe(1);

    // manually run 
    run();
    // should have run
    expect(dummy).toBe(2);
  });


  it('stop', () => {
    let dummy;
    const obj = reactive({ foo: 1 });
    const runner = effect(() => {
      dummy = obj.foo;
    });
    obj.foo = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.foo = 3;

    // obj.foo = obj.foo + 1
    obj.foo++;

    expect(dummy).toBe(2);

    // should not run after stop

    runner();
    expect(dummy).toBe(3);
  });

  it('onStop', () => {
    const obj = reactive({
      foo: 1
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(() => {
      dummy = obj.foo;
    }, {
      onStop
    });

    stop(runner);
    expect(onStop).toBeCalledTimes(1);


  });
});

