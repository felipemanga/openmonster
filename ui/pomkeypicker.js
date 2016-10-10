CLAZZ({
    EXTENDS:"UI",
    PROVIDES:{"ui.IPomkeyPicker":"implements"},
    INJECT:["playerData", "callback"],
    
    selection:0,
    
    
    CONSTRUCTOR:function(){
        this.lbl = {};
        this.uistates = {
            init:[]
        };
        
        var belt = this.playerData.belt = (this.playerData.belt || []);
        
        belt.forEach((desc, i)=>{
            this.lbl[i] = [ 150, i*10, desc.name, {option:"pomkey", anchorX:1} ];
            this.uistates.init.push(i);
        });
        
        if( !belt.length ){
            this.lbl.empty = [150, 0, "<< empty >>", {anchorX:1, alpha:0.5}]
            this.uistates.init.push('empty');
        }
        this.lbl.cancel = [150, 100, "Back", {option:"pomkey", anchorX:1}]
        this.uistates.init.push('cancel');
        
        SUPER();
        
        if( belt.length )
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
                if( this.selection == "cancel" ) next = this.playerData.belt.length - 1;
                else next = this.selection - 1;
                if( next < 0 ) next = "cancel";
                this.selectOption(next);
            },
            "DOWN":function(){
                var next;
                if( this.selection >= this.playerData.belt.length-1 ) next = "cancel";
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
            this.callback( this.playerData.belt[ this.getOption("pomkey") ] );
            this.destroy();
        }else this[name]();
    },
    
    cancel:function(){
        this.callback(null);
        this.destroy();
    }
});
