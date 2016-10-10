CLAZZ({
    EXTENDS:"UI",
    PROVIDES:{"ui.IBattle":"singleton"},
    INJECT:["playerData", "dlg"],

    lbl:{
        enemyName: [5, 5, "PONGAPEE"],
        enemyHP:   [5, 15, "9000"],
        allyName:  [5, 70, "BUGADAURO"],
        allyHP:    [5, 80, "9000"],

        pkpn:   [ 120,  115, "PkPn",   {option:"action"}],
        bag:    [ 80,   115, "Bag",    {option:"action"}],
        run:    [ 115,  130, "Run",    {anchorX:0.5, option:"action"}],
        fight:  [ 115,  100, "Fight",  {anchorX:0.5, option:"action"}]
    },
    
    uistates:{
        player:"pkpn, bag, run, fight, enemyName, enemyHP, allyName, allyHP",
        starterPlayer:"pkpn, bag, run, fight, enemyName, enemyHP"
    },
    
    keys:{
        player:{
            "UP":function(){ this.selectOption("fight"); },
            "DOWN":function(){ this.selectOption("run"); },
            "LEFT":function(){ this.selectOption("bag"); },
            "RIGHT":function(){ this.selectOption("pkpn"); },
            "ACCEPT":function(){ this.activateOption( this.getOption("action") ); },
        },
        starterPlayer:{
            "DOWN":function(){ this.selectOption("run"); },
            "LEFT":function(){ this.selectOption("bag"); },
            "RIGHT":function(){ this.selectOption("pkpn"); },
            "ACCEPT":function(){ this.activateOption( this.getOption("action") ); },
        }
    },
    
    _isStarter:false,
    isIntro:true,
    turn:1,
    allyDesc:null,
    allyPkpn:null,
    enemyPkpn:null,
    enemyDesc:null,
    context:null,

    
    setEnabled:function(e){
        SUPER(e);
        if( e ){
            if( this.state != "init" ) this.setState("init");
            else this.initBegin();
        }
    },
    
    isStarter:function(){
        return this._isStarter;
    },
    
    initBegin:function(){
        this._isStarter = !this.playerData.captureCount;
        this.isIntro = 1;
        this.turn = 1;

        this.enemyDesc = CLAZZ.get("enemypomkey");
        this.lbl.enemyName.setText( this.enemyDesc.name + " Lv" + this.enemyDesc.level  );
        this.enemyPkpn = CLAZZ.get("Pomkey", { 
            state:"enemy",
            pkpn: this.enemyDesc, 
            onAnimationComplete:this.onEnemyAnimationComplete.bind(this) 
        });

        this.context = { enemy:this.enemyDesc.name };
        this.dlg.addContext("battle", this.context);
        this.allyDesc = null;
        for( var i=0; i<this.playerData.belt.length; ++i ){
            var pkpn = this.playerData.belt[i];
            pkpn.alive = pkpn.HP > 0;
            if( pkpn.HP > 0 && !this.allyDesc ){
                this.allyDesc = pkpn;
                this.instanceAlly(this.allyDesc);
                this.isIntro = 2;
            }
        }
    },
    
    instanceAlly:function(data){
        if( this.allyPkpn ) this.allyPkpn.goAway();
        
        this.allyPkpn = CLAZZ.get("Pomkey", { 
            state:"ally", 
            onAnimationComplete:this.onAllyAnimationComplete.bind(this),
            pkpn: this.allyDesc = data
        });
        this.lbl.allyName.setText( this.allyDesc.name + " Lv" + this.allyDesc.level  );
        this.context.ally = this.allyDesc.name;
    },
    
    playerBegin:function(){
        this.lbl.fight.optionEnabled = true;
        this.lbl.enemyHP.setText( Math.floor(this.enemyDesc.HP) + " HP"  );
        this.selectOption( this.getOption("action") );
        if( this.allyDesc.alive ){
            this.lbl.allyHP.setText( Math.floor(this.allyDesc.HP) + " HP" );
        }else{
            this.allyPkpn.goAway();
            this.allyPkpn = null;
            this.allyDesc = null;
            this.dlg.convo([
                "Oh, no! {battle.ally} fainted!",
                () => this.pkpn(),
                "Pick another Pomkeypon to continue the battle!"
            ]);
        }
    },
    
    starterPlayerBegin:function(){
        this.lbl.fight.optionEnabled = false;
        this.lbl.enemyHP.setText( Math.floor(this.enemyDesc.HP) + " HP"  );
        this.selectOption("bag");
    },
    
    introCheck:function( trigger ){
        if( this.isIntro ){
            this.isIntro--;
            if( this.isIntro ) return true;
            else if( this.allyPkpn ){
                this.setState("player");
                this.selectOption("fight");
                return true;
            }else{
                this.setState("starterPlayer");
                this.selectOption("pkpn");
                return true;
            }
        }else if( trigger == this.turn ){
            this.turn = !this.turn;
            if( this.turn ){
                if( this.allyPkpn && this.allyDesc.alive ){
                    this.setState("player");
                    this.selectOption("fight");
                }else{
                    if( this.allyPkpn ){
                        this.allyPkpn.goAway();
                        this.allyPkpn = null;
                        this.setState("wait");
                        return;
                    }
                    this.setState("starterPlayer");
                    this.selectOption("pkpn");
                }
            }else{
                if( !this.enemyDesc.isWild ) this.main.exitBattle();
                else if( this.enemyDesc.alive ) this.setState("enemy");
                else this.setState("win");
            }
        }
    },
    
    onEnemyAnimationComplete:function(){
        this.introCheck(0);
    },

    onAllyAnimationComplete:function(){
        this.introCheck(1);
    },

    winBegin:function(){
        this.dlg.convo([
            "{battle.ally} defeated {battle.enemy}!",
            () => this.main.exitBattle()
        ]);
    },
    
    enemyBegin:function(){
        this.enemyPkpn.doAttack( this.allyDesc );
    },
    
    run:function(){
        this.main.exitBattle();
        this.dlg.mini("You ran away!", 1000);
    },
    
    pkpn:function(){
        CLAZZ.get("ui.IPomkeyPicker", {
            callback:this.onPickPkPn.bind(this)
        });
        
        this.setState("wait");
    },
    
    waitBegin:function(){
        this.call("clearUI");
    },
    
    waitEnd:function(){
        this.call("restoreUI");
    },
    
    onPickPkPn:function(desc){
        if( !desc || desc == this.allyDesc ){
            if( this.allyPkpn ) this.setState('player');
            else this.setState('starterPlayer');
        }else{
            this.setState("animation");
            this.instanceAlly(desc);
        }
    },
    
    onPickItem:function(name){
        if( !name ){
            if( this.allyPkpn ) this.setState('player');
            else this.setState('starterPlayer');
        }else{
            this.useItem(name);
        }
    },

    useItem:function(name){
        var item;
        try{
            item = CLAZZ.get("item." + name);
            item.useInBattle();
            var bag = this.playerData.bag;
            bag[name].amount--;
            if( bag.amount <= 0 )
                delete bag[name];
            this.introCheck(1);
        }catch(e){
            this.dlg.mini("That item can't be used now!");
            console.warn(e.stack);
        }
    },
    
    bag:function(){
        CLAZZ.get("ui.IBag", {
            callback:this.onPickItem.bind(this)
        });
        
        this.setState("wait");
    },
    
    fight:function(){
        this.setState("animation");
        this.allyPkpn.doAttack( this.enemyDesc, "Tackle" );
    }
});
