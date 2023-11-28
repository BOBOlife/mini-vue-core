import { h, renderSlots, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: 'MyFoo',
  setup() {
    const instance = getCurrentInstance()
    console.log("Foo:>>", instance);

    return {}
  },
  render() {
    const foo = h('p', {}, "foo")
    //  Foo .vnode .children 
    console.log(this.$slots)
    // return h("div", {}, [foo])
    // children 里面必须是 虚拟节点

    // 可以用一个内部函数来让 this.$slots =>  h('div', {}, this.$slots)
    // return h("div", {}, [foo, renderSlots(this.$slots)])
    // renderSlots 
    // 1. 获取到要渲染的元素
    // 2. 获取到渲染的位置


    // 作用域插槽
    const age = 18
    return h('div', {}, [
      renderSlots(this.$slots, 'header', {
        age
      }),
      foo,
      renderSlots(this.$slots, 'footer')
    ])
  }
}