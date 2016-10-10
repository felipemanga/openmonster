CLAZZ({
    EXTENDS:"UI",
    PROVIDES:{"ui.IBag":"implements"},
    INJECT:["playerData", "callback"],
    
    selection:0,
    bag:null,
    
    
    CONSTRUCTOR:function(){
        this.lbl = {};
        this.uistates = {
            init:[]
        };
        
        var bag = this.bag = Object.keys(this.playerData.bag);
        
        bag.forEach((name, i)=>{
            var desc = this.playerData.bag[name];
            var amount = "";
            if( desc.amount == 0 ) return;
            if( desc.amount > 1 ) amount = "x" + desc.amount;
            
            this.lbl[i] = [ 1, i*10, name + " " + amount, {option:"item", anchorX:0} ];
            this.uistates.init.push(i);
        });
        
        if( !bag.length ){
            this.lbl.empty = [150, 0, "<< empty >>", {anchorX:1, alpha:0.5}]
            this.uistates.init.push('empty');
        }
        this.lbl.cancel = [this.main.width, this.main.height, "Back", {option:"item", anchorX:1, anchorY:1}]
        this.uistates.init.push('cancel');
        
        SUPER();
        
        if( bag.length )
            this.selectOption(0);
        else
            this.selectOption("cancel");
            
        this.setState("init");
    },
    
    selectOption:function(o){
        SUPER(o);
        this.selection = o;
    },

    keys:{
        init:{
            "UP":function(){
                var next;
                if( this.selection == "cancel" ) next = this.bag.length - 1;
                else next = this.selection - 1;
                if( next < 0 ) next = "cancel";
                this.selectOption(next);
            },
            "DOWN":function(){
                var next;
                if( this.selection >= this.bag.length-1 ) next = "cancel";
                else next = this.selection + 1;
                this.selectOption(next);
            },
            "ACCEPT":function(){
                this.activateOption( this.selection );
            }
        }
        
    },
    
    activateOption:function(name){
        if( !this[name] ){
            this.callback( this.bag[ this.getOption("item") ] );
            this.destroy();
        }else this[name]();
    },
    
    cancel:function(){
        this.callback(null);
        this.destroy();
    }
});
