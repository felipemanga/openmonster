CLAZZ({
    EXTENDS:"UI",
    PROVIDES:{"dlg":"singleton"},
    
    msg:"",
    bg:null,
    txt:null,
    maxTime:0,
    speed:50,
    group:null,
    
    keys:{
        read:{
            "ACCEPT":"skip"
        },
        write:{
            "LEFT": function(){ this.col--; this.updateSelection(); },
            "RIGHT":function(){ this.col++; this.updateSelection(); },
            "UP":   function(){ this.row--; this.updateSelection(); },
            "DOWN": function(){ this.row++; this.updateSelection(); },
            "ACCEPT":function(){ this.activateOption( this.getOption("letter") ); }
        }
    },
    
    letters:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.".split(""),
    col:0,
    row:0,
    maxCol:10,
    maxRow:7,
    
    context:null,
    
    CONSTRUCTOR:function(){
        this.context = {};
        
        this.lbl = {
            "confirm":[ 
                this.game.width -60,
                this.game.height-15,
                "confirm",
                {option:"letter"}
                
            ],
            "del":[
                this.game.width -100,
                this.game.height-15,
                "del",
                {option:"letter"}
            ]
        };
        this.uistates = { "write":["confirm", "del"], read:"" };
        this.gameState = undefined;
        this.letters.forEach((letter, i)=>{
            var col = i%10, row = Math.floor(i/10);
            this.lbl[letter] = [
                7+col*15, 
                40+row*15,
                letter,
                {
                    option:"letter", 
                    letterIndex:i, 
                    letterColumn:col, 
                    letterRow:row
                }
            ];
            this.uistates.write.push(letter)
        });
        
        SUPER();
        
        this.group = this.add("group");
        
        var bmd = this.add("bitmapData", 1, 1);
        bmd.fill(255,255,255,255);
        var bg = this.bg  = this.add("image", 0, 0, bmd);
        bg.inputEnabled = true;
        bg.events.onInputDown.add(this.skip.bind(this));
        this.group.add(this.bg);
        
        this.txt = this.add("text", 5, 0, "", {
            wordWrap:true,
            wordWrapWidth: this.main.width-2
        });
        this.txt.font = "PressStart2P";
        this.txt.lineSpacing = -5;
        this.group.add(this.txt);

        for( var k in this.all )
            this.group.add( this.all[k] );
    },
    
    addContext:function(name, ctx){
        this.context[name] = ctx;
    },
    
    updateSelection:function(){
        this.col = this.col % this.maxCol;
        if( this.col < 0 ) this.col = this.maxCol + this.col;
        this.row = this.row % this.maxRow;
        if( this.row < 0 ) this.row = this.maxRow + this.row;
        
        var index = this.row * this.maxCol + this.col;
        if( index == this.letters.length ) this.selectOption("del");
        else if( index > this.letters.length ){
            this.col -= index - this.letters.length - 1;
            this.selectOption("confirm");
        }else this.selectOption(this.letters[index]);
    },
    
    skip:function(){
        if( this.txt.text != this.msg )
            this.txt.setText( this.msg );
        else this.maxTime = 1; 
    },
    
    mini:function(msg, maxTime, cb, maxInputLength){
        if( typeof msg == "function" ){
            msg();
            return this.shiftConvoQueue();
        }
        
        if( typeof msg == "object" ){
            maxTime = msg.maxTime;
            cb = msg.cb;
            msg = msg.msg;
            maxInputLength = msg.maxInputLength || 10;
        }
        
        msg = (msg||"").toString();
        var match;
        while( (match = msg.match(/\{([a-zA-Z_0-9]+)\.([a-zA-Z_0-9]+)\}/)) ){
            var ctx = this.context[match[1]];
            if( !ctx ) break;
            var val = ctx[match[2]];
            msg = msg.substr(0, match.index) + val + msg.substr(match.index+match[0].length);
        }
            
        var txt=this.txt;
        txt.fontSize = 8;
        this.msg = msg;
        txt.setText("");
        this.maxTime = maxTime;
        this.ttu = 0;
        this.speed = 25;
        
        if( !cb ){
            txt.anchor.setTo(0,1);
            txt.x = 1;
            txt.y = this.game.height;
            this.setState("read");
        }else{
            this.confirm = cb;
            this.maxInputLength = maxInputLength;
            txt.x = 1;
            txt.y = 0;
            txt.anchor.setTo(0,0);
            this.setState("write");
        }
    },
    
    convoQueue:null,
    shiftConvoQueue:function(){
        var convoQueue = this.convoQueue;
        if( !convoQueue || !convoQueue.length )
            this.setState("hidden");            
        else
            this.mini( convoQueue.shift() );
    },
    
    convo:function(arr){
        this.convoQueue = arr;
        this.shiftConvoQueue();
    },
    
    ttu:0,
    inputText:"",
    maxInputLength:0,
    update:function( time ){
        var txt = this.txt;
        this.bg.y = txt.y;
        this.bg.x = 0;
        this.bg.height = txt.height;
        this.bg.width  = this.main.width;
        this.bg.anchor.setTo( txt.anchor.x, txt.anchor.y );

        this.ttu -= time;
        if( this.ttu <= 0 && txt.text.length < this.msg.length ){
            txt.setText( txt.text + this.msg[txt.text.length] );
            this.ttu = this.speed;
        }
        
        var group = this.group;
        if( group.parent.children[ group.parent.children.length - 1 ] != group )
            group.parent.bringToTop( group );
    },
    
    activateOption:function(name){
        this.ttu = undefined;
        if( name == "confirm" )
            this.setState("hidden");

        if( this[name] ) this[name]( this.inputText );
        else if( this.inputText.length < this.maxInputLength ) this.inputText += name;
        
        if(name != "confirm" )
            this.txt.setText( this.msg + this.inputText );
    },
    
    confirm:null,
    
    del:function(){
        this.inputText = this.inputText.substr(0, this.inputText.length-1 );
    },
    
    writeBegin:function(){
        this.inputText = "";
        this.selectOption("A");
    },
    
    write:function( time ){
        this.update( time );
    },
    
    read:function( time ){
        if( this.maxTime > 0 ){
            this.maxTime -= time;
            if( this.maxTime <= 0 )
                this.shiftConvoQueue();
        }
        
        this.update(time);
    },
    
    hiddenBegin:function(){
        this.group.visible = false;
    },
    
    hiddenEnd:function(){
        this.group.visible = true;
    }
});