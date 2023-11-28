import { h, createTextVNode, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js';

export const App = {
  name: 'MyApp',
  setup() {
    const instance = getCurrentInstance()
    console.log("App:>>", instance);

    return {}
  },
  render() {

    const app = h('div', {}, "App")
    // const slotContent = [h("p", {}, '123'), h("p", {}, '456')] // 插槽插入的的内容
    //  可以具名插槽 指定渲染位置 object key 要改变数据结构 
    const slotContent = {
      header: ({ age }) => [h("p", {}, 'header' + age), createTextVNode('哈哈哈')], // 必须是虚拟节点
      footer: () => h("p", {}, 'footer')
    }

    const foo = h(Foo, {}, slotContent)  // 第三个是 slot 的插入值
    return h("div", {}, [app, foo])
  }
}