class MVVM {
    //用于接收参数 即 new MVVM({})中大括号中的而对象
    constructor(options){
       // 一上来先把可用的东西挂载在实例上
       // 保证他的原型方法都能调用到它的属性
       // $el是随便取的名字 写可以不带$ vue中习惯带$
       this.$el=options.el
       this.$data=options.data
       //如果有要编译的模板才编译
       if(this.$el){
           //数据劫持 就是把对象的所有属性改成get 和 set 方法
           new Observer(this.$data)
           new Compile(this.$el,this)
       }
    }
}