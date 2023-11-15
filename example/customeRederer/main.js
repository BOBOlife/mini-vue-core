import { createRenderer } from "../../lib/guide-mini-vue.esm.js";
import { App } from "./App.js";

const game = new PIXI.Application({
  width: 500,
  height: 400,
});

document.body.append(game.view);

// 自定义渲染器 渲染canvas平台
const renderer = createRenderer({
  // 这里是pixi的canvas渲染器
  createElement(type) {
    if (type === "rect") {
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000);
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();
      return rect;
    }
  },
  patchProp(el, key, val) {
    el[key] = val;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});
renderer.createApp(App).mount(game.stage);
