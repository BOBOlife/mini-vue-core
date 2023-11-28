import { reactive } from "../src/reactive";
import { computed } from "../src/computed";
import { vi } from "vitest";

describe("computed", () => {
  it("happy path", () => {
    // 重点是缓存
    const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });
    expect(age.value).toBe(1);
  });

  it("should compute lazily", () => {
    const value = reactive({
      foo: 1,
    });
    const getter = vi.fn(() => {
      return value.foo;
    });

    const computedValue = computed(getter);

    // lazy
    expect(getter).not.toHaveBeenCalled();
    expect(computedValue.value).toBe(1);

    // should not compute again
    computedValue.value;
    expect(getter).toHaveBeenCalledTimes(1);
    // should not compute until needed;
    value.foo = 2; // trigger -> effect -> get 重新执行了
    expect(getter).toHaveBeenCalledTimes(1);

    // now it should compute
    expect(computedValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    // should not compute again
    computedValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
