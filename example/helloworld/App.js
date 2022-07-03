import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  // render 必写
  render() {
    // SFC .vue
    // template
    // render
    return h('div', {
      id: 'root',
      class: ['red', 'hard']
    },
      [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue")]
      // "hi,ni"
    )
  },

  setup() {
    // composition Api
    return {
      msg: 'hello,world'
    }
  }
}