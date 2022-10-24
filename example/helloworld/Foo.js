import { h } from '../../lib/guide-mini-vue.esm.js';

// 1.  props 传进来
// 2.  return value 来读取
// 3.  shallow readonly
export const Foo = {
  setup(props) {
    console.log('props:>>', props)
    props.count++
    console.log(props);
  },
  render() {
    return h("div", {}, "foo:" + this.count)
  }
}