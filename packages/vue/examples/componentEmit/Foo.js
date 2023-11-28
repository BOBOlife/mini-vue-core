import { h } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: 'MyFoo',
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log('emit click');
      emit('add', 1, 2)
      emit('add-foo', 3, 4)
    }

    return {
      emitAdd
    }
  },
  render() {
    const btn = h('button', {
      onClick: this.emitAdd
    }, '点击我')

    const foo = h('p', {}, "info")
    return h("div", {}, [foo, btn])
  }
}