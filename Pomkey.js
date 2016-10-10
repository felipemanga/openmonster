
var liveCount = 0;

CLAZZ({
    EXTENDS:GO,
    PROVIDES:{"far.Pomkey":"implements"},
    INJECT:{
        pomkeydex:"data.IPomkeydex",
        world:"far.World", 
        lat:"latitude", 
        lon:"longitude", 
        seed:"seed", 
        spawnKey:"spawnKey", 
        starter:"starter"
    },
    
    sprite:null,
    pkpn:null,
    
    spawnTime:0,
    ttl:0,
    starter:false,
    seed:0,

    CONSTRUCTOR:function(){
        SUPER();
        liveCount++;
        this.spawnTime = performance.now();
        this.ttl = Math.random() * 20000+15000;

        var data, pkpn;
        if( this.starter ) this.pkpn = this.pomkeydex.bySeed(this.seed, {isStarter:true});
        else this.pkpn = this.pomkeydex.bySeed(this.seed);
        data = this.pkpn.data;
        
        this.sprite = this.add("image", -500, -500, data.front, undefined, this.world.group );
        this.sprite.scale.setTo(0.5),
        this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.sprite.shader = new KOFilter();
        if(Math.random()>0.5) this.sprite.scale.x *= -1;

        this.sprite.anchor.setTo(0.5,0.8);
        this.sprite.lat = this.lat;
        this.sprite.lon = this.lon;
    },
    
    setEnabled:function( e ){
        SUPER(e);
        if((e && (!this.pkpn.isWild || !this.pkpn.alive )) || (!e && this.starter)){
            this.pkpn.alive = true;
            this.ttl = 0;
        }
    },
    
    onRender:function( time ){
        if(!this.pkpn.alive)
            return;
            
        this.ttl -= time;
        this.pkpn.alive = this.ttl > 0;
        if(!this.pkpn.alive){
            this.world.unspawn(this.spawnKey);
            this.destroy();
        }
    },
    
    pollNearest:function(ref){
        var x = this.sprite.x - ref.x;
        var y = this.sprite.y - ref.y;
        var d = x*x+y*y;
        if( this.pkpn.alive && this.ttl && (!ref.max || d < ref.max) && d < ref.d ){
            ref.d = d;
            return this;
        }
    }
});

CLAZZ({
    EXTENDS:"GO",
    MIXIN:["StateMachine"],
    PROVIDES:{"near.Pomkey":"implements"},
    INJECT:["pkpn", "state", "onAnimationComplete", "dlg"], 
    
    isEnemy:false,
    targetX:0,
    targetY:0,
    
    CONSTRUCTOR:function(){
        SUPER();
        
        var img = this.state != "ally" 
                ? this.pkpn.data.front
                : this.pkpn.data.back;
        
        this.sprite = this.add("image", 0, 0, img );
        this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.sprite.shader = new KOFilter();
        
        var state = this.state;
        this.state = undefined;
        this.setState(state);
    },
    
    getEnemy:function(){
        if( this.isEnemy )
            return this.pkpn;
    },
    
    onTick:function(time){
        if( this[this.state] )
            this[this.state](time);
    },
    
    enemyBegin:function(){
        this.isEnemy = true;
        this.targetX = 160;
        this.targetY = 0;
        this.sprite.anchor.setTo(1, 0);
        this.setState("enter");
    },
    
    allyBegin:function(){
        this.sprite.anchor.setTo(0, 1);
        this.targetX = 0;
        this.targetY = 144;
        this.sprite.x = 160;
        this.sprite.y = 144;
        this.setState("enter");
    },
    
    waitBegin:function(){
        this.sprite.x = this.targetX;
        this.sprite.y = this.targetY;
        this.onAnimationComplete();
    },

    enter:function(){
        var delta = (this.sprite.x - this.targetX) * 0.1;
        this.sprite.x -= delta;
        if( Math.abs(delta) < 0.5 ) this.setState("wait");
    },
    
    exit:function(time){
        var delta = (this.sprite.x + 64) * 0.1;
        this.sprite.x -= delta;
        if( Math.abs(delta) < 0.5 )
            this.destroy();
    },
    
    bounceI:0,
    bounceBegin:function(){
        this.bounceI = 0;
    },
    
    bounce:function(time){
        this.bounceI += time * 10 / 1000;
        this.sprite.y = this.targetY - Math.sin( this.bounceI ) * 10;
        if( this.bounceI >= Math.PI )
            this.setState("wait");
    },
    
    doAttack:function( target, pick ){
        pick = pick || this.pkpn.moves[ Math.floor(Math.random()*this.pkpn.moves.length) ];
        pick = pick.toLowerCase();
        var clazz = move[ Object.keys(move).find(key => key.toLowerCase() == pick) ];
        if( !clazz ){
            this.dlg.mini( this.pkpn.name + " forgot how to " + pick + "!");
            this.setState("wait");
            this.onAnimationComplete();
            return;
        }
        var m = new clazz();
        m.use( this.pkpn, target );
        this.setState("bounce");
    },
    
    goAway:function(){
        this.setState("exit");
    },
    
    clearUI:function(){
        this.sprite.visible = false;
    },
    
    restoreUI:function(){
        this.sprite.visible = true;
    }
});

