import { isReadonly, readonly, isProxy } from "../src/reactive";
import { vi } from "vitest";

describe("readonly", () => {
  it("should make nested values readonly ", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    // 嵌套对象 readonly
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
    expect(isProxy(original)).toBe(false);
    expect(isProxy(wrapped)).toBe(true);
  });

  it("warn when call set", () => {
    // mock

    console.warn = vi.fn(); //会创建一个带有特殊属性的function 这些属性会做断言来使用
    const user = readonly({
      age: 18,
    });

    user.age++;

    expect(console.warn).toBeCalled; // 看看这个方法有没有被调用
  });
});
