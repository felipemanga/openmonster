CLAZZ("StateMachine", {
    state:null,
    setState:function(state){
        var oldState = this.state;
        if( oldState == state) return;
        this.state = state;
        var args = Array.prototype.slice.call(arguments, 1);
        if(typeof this[oldState+"End"] == "function") this[oldState+"End"]();
        if(typeof this[state+"Begin"] == "function" ) this[state+"Begin"].apply(this, args);
        if(typeof this.onChangeState == "function"  ) this.onChangeState(state, oldState, args);
    }
});

CLAZZ("GO", {
    INJECT:["game", "pool", "call", "main", "cursors"],
    gameState:null,
    DOs:null,
    enabled:true,
    
    CONSTRUCTOR:function(){
        this.pool.add(this);
        this.DOs = [];
    },
    
    onChangeGameState:function(newState, oldState){
        if( this.gameState === null ) this.gameState = oldState;
        if( !this.gameState ){
            var pool = this.main.pools[newState];
            this.pool.remove(this);
            this.pool = pool;
            this.call = pool.call.bind(pool);
            this.pool.add(this);
            return;
        }
        this.setEnabled( this.gameState == newState );
    },
    
    setEnabled:function(e){
        e=!!e;
        
        if( this.enabled == e ) return;
        this.enabled = e;
        
        
        if( e ){
            var pool = CLAZZ.get("pool");
            if( this.pool != pool ){
                this.pool.remove(this);
                this.pool = pool;
                this.call = pool.call.bind(pool);
                this.pool.add(this);
            }
            
            this.DOs.forEach( (DO)=>{
                if(!DO.managed) return;
                if(DO.managedParent) DO.managedParent.add(DO);
            });
        }else{
            this.DOs.forEach( (DO)=>{
                if(!DO.managed) return;
                DO.managedParent = DO.parent;
                if(DO.parent) DO.parent.remove(DO);
            });
        }
    },
    
    add:function(type){
        if( !type ) return;
        var DO;
        if( typeof type != "string" ){
            DO = type;
        }else{
            var args = Array.prototype.slice.call(arguments, 1);
            DO = this.game.add[type].apply(this.game.add, args);
            DO.managed = true;
            DO.managedParent = DO.parent;
        }
        if(this.DOs.indexOf(DO) != -1) return;
        this.DOs[this.DOs.length] = DO;
        return DO;
    },
    
    remove:function(DO){
        var pos = this.DOs.indexOf(DO);
        if(pos==-1) return;
        this.DOs.splice(pos, 1);
    },
    
    destroy:function(){
        this.pool.remove(this);
        this.DOs.forEach( (DO)=>{
            if(!DO.managed) return;
            if( DO.parent )
                DO.parent.remove(DO);
            DO.destroy();
        });
    }
});

CLAZZ("UI", {
    EXTENDS:"GO",
    MIXIN:["StateMachine"],
    
    all:null,
    lbl:null,
    uistates:null,
    keys:null,
    keymon:null,

    CONSTRUCTOR:function(){
        SUPER();
        var k;
        this.keymon = {};
        this.all = this.all || {};
        this.uistates = this.uistates || {};
        for( k in this.uistates ){
            if( typeof this.uistates[k] == "string" )
                this.uistates[k] = this.uistates[k].trim().split(/\s*,\s*/);
        }
        
        if( this.lbl ){
            var nlbl = {};
            for( k in this.lbl ){
                var cmd = ["text"].concat(this.lbl[k]), opt = cmd[4] || {};
                var lbl = this.all[k] = nlbl[k] = this.add.apply( this, cmd );
                if( !opt.font ){
                    lbl.font = "PressStart2P";
                    lbl.fontSize = 8;
                }
                DOC.mergeTo( lbl, opt );
                if( opt.anchorX ) lbl.anchor.x = opt.anchorX;
                if( opt.anchorY ) lbl.anchor.y = opt.anchorY;
                if( opt.option ){
                    lbl.inputEnabled = true;
                    lbl.input.useHandCursor = true;
                    lbl.events.onInputDown.add( this.onInputDown.bind(this, k) );
                }
                lbl.visible = false;
            }
            this.lbl = nlbl;
        }
    },
    
    selectOption:function(name, option){
        var opt = this.all[name] || {};
        option = option || opt.option;
        for( var k in this.all ){
            if( this.all[k].option != option ) continue;
            
            var selected = this.all[k].optionSelected = k == name;
            if( selected ) this.all[k].alpha = 1;
            else if( this.all[k].optionEnabled !== false ) this.all[k].alpha = 0.75;
            else this.all[k].alpha = 0.5;
        }
    },
    
    getOption:function(option){
        for( var k in this.all ){
            var v = this.all[k];
            if( v.option == option && v.optionSelected ) 
                return k;
        }
        return null;
    },
    
    activateOption:function(name){
        if(this[name]) this[name]();
        else console.log("impl:", this.constructor.NAME + "." + name );
    },
    
    onInputDown:function(name){
        var opt = this.all[name];
        if(opt.optionEnabled===false) return;
        if(!opt.optionSelected) this.selectOption(name);
        this.activateOption(name);
    },
    
    onChangeState:function(state, oldState){
        var k, v;
        if( oldState in this.uistates ){
            this.uistates[oldState].forEach((k) =>{ 
                if(this.all[k]) this.all[k].visible = false; 
            });
        }
        if( state in this.uistates ){
            this.uistates[state].forEach((k) =>{ 
                if(this.all[k]) this.all[k].visible = true;
            });
        }
        this.keymon = {};
    },

    onTick:function( time ){
        var kb = this.game.input.keyboard, skeys;
        
        if( this.keys && this.state in this.keys ){
            skeys = this.keys[this.state];
            for( var k in skeys ){
                if( k == "ACCEPT" ){
                    ["Z", "X", "SPACE", "ENTER"].forEach( tk => test.call(this, k, tk) );
                }else test.call(this, k, k);
            }
        }

        if( typeof this[this.state] == "function" )
            this[this.state](time);
            
        function test(k, tk){
            if( kb.isDown(Phaser.Keyboard[tk]) ) this.keymon[tk] = true;
            else if( this.keymon[tk] ){
                this.keymon[tk] = false;
                if( typeof skeys[k] == "string" ) this[ skeys[k] ]();
                else skeys[k].call(this);
            }
        }
    }
});

CLAZZ("PhaserGame", {
    INJECT:["DOM", "element"],
    MIXIN:["StateMachine"],
    
    game:null,
    pool:null,
    pools:null,
    state:null,
    states:null,
    
    width:1024,
    height:768,
    
    lastFrameTime:0,
    timeDelta:0,
    
    startPhaser:function(){
        this.pools = {};
        this.game = new Phaser.Game( this.width, this.height, Phaser.AUTO, this.element, this );
        this.lastFrameTime = performance.now();
    },
    
    preload: function(){
		console.log("PRELOAD");
        for( var k in FS.URL ){
            if( /\.png$|\.jpg$/i.test(k) ){
                var name = k; // k.replace(/\.[a-z]+/i, "").replace(/\//g, ".");
                if( FS.JSON[k + ".json"] ){
                    // console.log("Loading atlas: ", k, " -> '"+name+"'");
                    this.game.load.atlas( name, FS.URL[k], null, FS.JSON[k+".json"] )
                }else{
                    // console.log("Loading image: ", k, " -> '"+name+"'");
                    this.game.load.image( name, FS.URL[k] );
                }
            }
        }
    },
    
    create: function(){
        var game = this.game;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        CLAZZ.set( "main", this );
        CLAZZ.set( "game", this.game );
        CLAZZ.set( "cursors", this.game.input.keyboard.createCursorKeys());
        this.setState("boot");
    },
    
    update: function(){
        var time = performance.now();
        this.timeDelta = time - this.lastFrameTime;
        this.lastFrameTime = time;
        if(this.pool) this.pool.call("onTick", this.timeDelta );
    }, 
    
    render: function(){
        if(this.pool) this.pool.call("onRender", this.timeDelta );
    },
    
    resetState:function(state){
        this.pools[state] = null;
    },
    
    onChangeState:function(state, oldState, args){
        var pool = this.pools[state];
        var wasInit = !!pool;
        if( !pool ){
            pool = this.pools[state] = new DOC.Pool();
            pool.add(this);
            pool.silence("onChangeGameState");
        }
        
        if(this.pool) this.pool.call("onChangeGameState", state, oldState);
        
        this.pool = pool;
        
        CLAZZ.set( "pool", pool );
        CLAZZ.set( "call", pool.call.bind(pool) );
        this.pool.call("onChangeGameState", state, oldState );
        
        if( !wasInit && this.states && this.states[state] )
            this.states[state].forEach( d=>{
                var obj = CLAZZ.get(d, args[0]);
                if( obj && obj.onChangeGameState ) 
                    obj.onChangeGameState(state, state);
            });
            
    }
});