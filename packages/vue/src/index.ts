//出口
export * from "@mini-vue-core/runtime-dom";
import { baseCompile } from "@mini-vue-core/compiler-core";
import * as runtimeDom from "@mini-vue-core/runtime-dom";
import { registerRuntimeCompiler } from "@mini-vue-core/runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
