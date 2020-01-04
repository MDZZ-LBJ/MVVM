/*  用于模板编辑的js */
class Compile {
    constructor(el,vm){
       this.el=this.isElementNode(el) ? el : document.querySelector(el)
       this.vm=vm
       if(this.el){

           //1.第一步 先把真实的DOM放到内存中
           let fragment=this.node2fragment(this.el)

           //2.第二步 编译 提取想要的元素节点(v-model)和文本节点({{}})

           this.compile(fragment)

           //3.第三步  把编译好的 fragmen 赛回到页面里去
           this.el.appendChild(fragment)
       }
    }

/*辅助性的方法*/

  isElementNode(node){
      return node.nodeType===1
  }
  //是不是指令
  isDirective(name){
    return name.includes('v-')
  }


/*核心的方法*/
    node2fragment(el){
        let fragment=document.createDocumentFragment()
        let firstChild
        while (firstChild=el.firstChild){
            fragment.appendChild(firstChild)
        }

        return fragment //内存中的节点
    }

    compile(fragment){
        // 需要递归拿去全部节点
        let childNodes=fragment.childNodes
        //childNodes是类数组 包含全部父节点 一个文档集合
        // 需要先转化为数组再遍历 拿到所有节点 判断是否是需要编译的节点
        Array.from(childNodes).forEach(node=>{
          if(this.isElementNode(node)){
              // 是元素节点 判断有无 v-model 然后编译元素
              this.compileElement(node)

              //递归再判断儿子元素是否是元素节点
              this.compile(node)
          }else {
              //是文本节点 判断有无双大括号  然后编译文本
              this.compileText(node)
          }
        })
    }

    compileElement(node){
        // 编译带 v-model v-text 等的元素

        //取出节点的所有属性
        let attrs= node.attributes
        Array.from(attrs).forEach(attr=>{
            // attr 为 type="text" v-model="message"
            // attr.name 为type v-model  attr.value 为 message
            //判断属性名是否包含 v-
            if(this.isDirective(attr.name)){
              //取到v- 对应的值放到节点中 从vm中的data中取
               //let type=attr.name.slice(2) //取到是v-什么 可能是model text
               //装逼的写法 结构赋值  ['v-','model'] 'mode'赋值给type
               let [,type] =attr.name.split('-')
                CompileUtil[type](node,this.vm,attr.value)
            }
        })
    }

    compileText(node){
        // 编译带 {{}} 的文本

        //取文本中的内容
        let text=node.textContent
        //正则匹配 {{}}
        let reg=/\{\{([^}]+)\}\}/g
        if(reg.test(text)){
            CompileUtil['text'](node,this.vm,text)
        }

    }
}

// 编译的工具方法
CompileUtil={
    getVal(vm,expr){
       //有可能 v-model='message.a.b' 我们不知道对象有多少级
        //所以要逐个找到
       expr=expr.split('.')
       //reduce 方法可以将上一次的结果作为下一次的初始值
        return  expr.reduce((prev,next)=>{
                   //第一次时 prev是vm.$data next是数组的第一项 逐次类推
                   return prev[next]
               },vm.$data)
    },

    getTextVal(vm,expr){
        return expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
            return this.getVal(vm,arguments[1])
        })
    },

    text(node,vm,expr){ // 文本编译处理
      // 调取对应更新数据的方法
      let updateFn=this.updater['textUpdater']
     // 此时的expr 是{{message.a}} 所以要去除{{}} 拿到里面的内容
      let value=this.getTextVal(vm,expr)

        expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
            //这里应该加一个监控 数据变化了 应该调用这个watch的callback
            new Watcher(vm, arguments[1],(newVal)=>{
                // 如果数据变化了 文本节点需要重新获取依赖的属性更新文本的内容
                updateFn && updateFn(node,this.getTextVal(vm,expr))
            })

        })
        updateFn && updateFn(node,value)  // 这个方法存在时才调取
    },

    setVal(vm,expr,value){
        expr=expr.split('.')
        return  expr.reduce((prev,next,currentIndex)=>{
             if(currentIndex===expr.length){
                 return prev[next]value
             }
            return prev[next]
        },vm.$data)
    },

    model(node,vm,expr){// v-model编译处理
       // 调取对应更新数据的方法
        let updateFn=this.updater['modelUpdater']

        //这里应该加一个监控 数据变化了 应该调用这个watch的callback
        new Watcher(vm,expr,(newVal)=>{
            updateFn && updateFn(node,this.getVal(vm,expr))  // 这个方法存在时才调取
        })

        node.addEventListener('input',(e)=>{
            let newValue=e.target.value
            this.setVal(vm,expr,newValue)
        })

        updateFn && updateFn(node,this.getVal(vm,expr))  // 这个方法存在时才调取
    },

    updater:{
        // 文本更新
        textUpdater(node,value){
            node.textContent=value
        },
        // v-model 输入框更新
        modelUpdater(node,value){
            node.value=value
        }
    }
}