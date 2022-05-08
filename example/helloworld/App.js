export const App = {
  render() {
    // SFC .vue
    // template
    // render


    return h('div', 'Hello', this.msg)
  },

  setup() {
    // composition Api

    return {
      msg: 'hello,world'
    }
  }
}