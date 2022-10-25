import { camelize, toHandlerKey } from "../shared/index";



// 注册的事件 匹配上 props 里面的key
export function emit(instance, event, ...args) {
  console.log('emit:>>', event);


  // instance.props ->  event
  const { props } = instance


  // TPP 
  // 以特定到通用
  const handlerName = toHandlerKey(camelize(event))

  const handler = props[handlerName]
  handler && handler(...args)

}