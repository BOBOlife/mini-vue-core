export const App = {
  render() {

    return h('div', 'Hello', this.msg)
  },

  setup() {
    // composition Api

    return {
      msg: 'hello,world'
    }
  }
}