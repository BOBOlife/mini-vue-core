import { h } from "../../dist/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  // render 必写
  render() {
    window.self = this;
    // SFC .vue
    // template
    // render
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
        onClick() {
          console.log("click Event");
        },
      },
      [
        h("div", {}, "hello" + this.msg),
        h(Foo, {
          count: 1,
        }),
      ]
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue")]
      // "hi,ni"
      // $el -> get root element
      // 'hi，' + this.msg
    );
  },

  setup() {
    // composition Api
    return {
      msg: "hello world",
    };
  },
};
