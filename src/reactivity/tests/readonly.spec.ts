import { readonly } from "../reactive";

describe('readonly', () => {
  it('happy path ', () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
  });

  it('warn when call set', () => {
    // mock

    console.warn = jest.fn(); //会创建一个带有特殊属性的function 这些属性会做断言来使用
    const user = readonly({
      age: 18
    });

    user.age++;

    expect(console.warn).toBeCalled; // 看看这个方法有没有被调用
  });
});