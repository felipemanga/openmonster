CLAZZ({
    EXTENDS:"GO",
    INJECT:{
        "cursors":"cursors",
        "world":"far.World",
        "data":"playerData"
    },
    PROVIDES:{"far.Bob":"singleton"},
    
    sprite:null,
    walking:false,
    
    CONSTRUCTOR:function(){
        SUPER();
        var s = this.sprite = this.add("image", 80, 70, "sprites/far/bob.png", undefined, this.world.group );
        s.animations.add('walk', null, 5, true);
        s.animations.add('stand', ["frame1"], 5, false);
        s.animations.play('stand');
        s.anchor.setTo(0.5, 1);
        this.pool.silence("pollNearest");
        
        this.world.starter = !this.data.captureCount;
        console.log("starter:", this.world.starter);
    },
    
    setEnabled:function( e ){
        SUPER(e);
        // if( this.world.starter && this.data.captureCount )
        this.world.tts = 1000;
        this.world.starter = !this.data.captureCount;
    },
    
    ttp:1,
    poll:function(){
        this.ttp = 1000;
        var ref = {x:this.sprite.x, y:this.sprite.y, d:Number.MAX_VALUE, max:500};
        var nearest = this.call("pollNearest", ref);
        if( !nearest ) return;
        this.main.battle(nearest.pkpn);
    },
    
    onTick:function( time ){
        this.ttp -= time;
        if( this.ttp<0 ) this.poll();
        
        var vx=0, vy=0;
        vy = Math.round(this.world.velLat*100000);
        vx = Math.round(this.world.velLon*100000);
        this.sprite.lat = this.world.lat;
        this.sprite.lon = this.world.lon;
        
        if(this.cursors.up.isDown) this.world.latOff++;
        if(this.cursors.down.isDown) this.world.latOff--;
        if(this.cursors.left.isDown) this.world.lonOff--;
        if(this.cursors.right.isDown) this.world.lonOff++;
        
        if( vx < 0 ) this.sprite.scale.x = -1;
        if( vx > 0 ) this.sprite.scale.x =  1;
        if( vx || vy ){
            if( !this.walking ) this.sprite.animations.play('walk');
        }else if( this.walking ) this.sprite.animations.play('stand');
        this.walking = vx || vy;
    }
});

CLAZZ("Main", {
    EXTENDS:"PhaserGame",
    width:160, 
    height:144,
    
    playerData:null,
    dlg:null,
    
    states:{
        "boot":["Title"],
		"intro":["dialogue.Intro"],
        "map":["far.World", "far.Bob"],
        "battle":["ui.IBattle"]
    },
	
	CONSTRUCTOR:function(){
		SUPER();
		var w = new DOC.Wait( this.loadPlugins, this );
        localforage.getItem( "playerData", w(this.onGetPlayerData) );
		this.loadMod( w(), "base.zip", null );
		w.start();
	},
	
    create:function(){
        SUPER();
        this.game.stage.filters = [new gbfilter()];
        this.game.stage.backgroundColor = "#D7EAE7";
        this.game.canvas.style.backgroundColor = "rgb(215, 234, 231)";
        this.game.renderer.renderSession.roundPixels = true;

        var dlg = this.dlg = CLAZZ.get("dlg");
        dlg.addContext("playerData", this.playerData);
    },
    
	loadMod:function( cb, path, data ){
		if( typeof path == "string" ) 
			DOC.getURL( path, this.loadMod.bind(this, cb, null), {binary:true} );
		if( data ) FS.mergeFS(data, cb);
	},
	
	loadPlugins:function(){
		var w = new DOC.Wait( this.onDoneLoading, this );
		for( var k in FS.JS ){
			FS.JS[k] = DOC.create("script", { 
				src:    FS.URL[k],
				onload: w(),
				parent: document.head
			});
		}
		w.start();
	},
	
	onDoneLoading:function( ){
        CLAZZ.get("data.IPomkeydex"); // make sure it's initialized.
		this.startPhaser();
	},
	
	onBootComplete:function(){
        var nextState = "map";
        // nextState = this.playerData.name === "" ? "intro" : "map";
        this.setState(nextState);
	},
    
    onGetPlayerData:function( pdata ){
        this.playerData = pdata = pdata || {
            name:"",
            level:0,
            exp:  0,
            belt:[],
            storage:[],
            bag:{ PKBALL:{amount:10} },
            captureCount:0
        };
        CLAZZ.set("playerData", pdata);
    },
	
	onIntroComplete:function(){
		this.setState("map");
	},
    
    addPkpn:function(desc, firstMsg){
        desc.isWild = false;
        var name = desc.data.name;
        var msg = [];
        if( firstMsg ) msg.push(firstMsg);
        if( this.playerData.belt.length >= 6 ){
            this.playerData.storage.push(desc);
            msg.push({
                msg: name + " was teleported to storage!", 
                maxTime:2000
            });
        }else this.playerData.belt.push(desc);
        this.dlg.convo(msg);
        
        this.playerData.captureCount = (this.playerData.captureCount||0) + 1;
    },
    
    mapBegin:function(){
        this.pool.silence("battle");
        CLAZZ.implements("Pomkey", far.Pomkey);
    },
    
    battleBegin:function(){
        CLAZZ.implements("Pomkey", near.Pomkey);
    },
    
    battle:function( pomkey ){
        this.resetState("battle");
        CLAZZ.set("enemypomkey", pomkey);
        this.setState("battle");
    },
    
    exitBattle:function(){
        this.setState("map");
    }
});
