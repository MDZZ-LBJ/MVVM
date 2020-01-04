class  Observer{
    constructor(data){
        this.observe(data)

    }

    observe(data){
        //把data这个数据改成get和set形式

        if(!data || typeof data!=='object' ){
            //空数据或者不是对象的数据不劫持
           return ''
        }

       //只有对象形式的数据才劫持
       // 1. 先获取对象的key value
       Object.keys(data).forEach(key=>{
           //开始劫持(响应式改变数据)
           this.defineReactive(data,key,data[key])
           //递归对每一个对象形式的数据进行劫持
           this.observe(data[key])

       })

    }

    // 响应式改变数据的方法
    defineReactive(obj,key,value){
        let that=this
        // 每个变化的数据都会对应一个数组 这个数组是存放所有更新的操作
        let dep=new Dep()
        //赋值的时候使用defineProperty方法可以加中间过程
        Object.defineProperty(obj,key,{
            enumerable:true, //可枚举
            configurable:true,//可操作数据
            get(){ //取值时调用的方法
                Dep.target && dep.addSub(Dep.target)
                /* 赋值的时候 这里可以加自定义事件 */
                return value
            },
            set(newValue){ //更改属性值
                /* 改变值的时候 这里可以加自定义事件 */
                if(value!=newValue){
                    that.observe(newValue)//如果是对象继续劫持
                    value=newValue
                    dep.notify() // 通知所有人数据更新了
                }
            }
        })
    }
}

class Dep {
  constructor(){
      //订阅的数组
      this.subs=[]

  }
  addSub(watcher){
      this.subs.push(watcher)
  }
  notify(){
      this.subs.forEach(watcher=>watcher.update())
  }
    
}





