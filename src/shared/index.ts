export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export const EMPTY_OBJECT = Object.create(null);

export const isString = (value) => typeof value === "string";

export const hasChanged = (val, newValue) => {
  return !Object.is(val, newValue);
};

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

// 烤肉串格式 转化成驼峰命名
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toHandlerKey = (str: string): string => {
  return str ? "on" + capitalize(str) : "";
};
