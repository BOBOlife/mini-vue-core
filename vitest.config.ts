import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true, // 全局可以使用
  },
  resolve: {
    alias: [
      {
        find: /@mini-vue-core\/(\w*)/,
        replacement: path.resolve(__dirname, "packages") + "/$1/src",
      },
    ],
  },
});
