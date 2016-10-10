CLAZZ("GBMap", {
    src:'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}.{ext}',
    z:16,
    x:13209,
    y:17120,
    ext:"png",
    s:'',
    salts:'abcd',
    lat:0,
    lon:0,
    
    onUpdate:null,
    cache:null,
    
    canvas:null,
    context:null,
    data:null,
    
    CONSTRUCTOR:function(src, salts){
        this.src = src || this.src;
        this.salts = salts || this.salts;
        this.s = this.s || this.salts.substr(Math.floor(Math.random()*this.salts.length), 1);
        
        var canvas = this.canvas = DOC.create("canvas", {width:256, height:256});
        this.context = canvas.getContext("2d");
        this.__invalidate();
    },
    
    __invalidate:function(){
		try{
        	this.data = new ImageData( new Uint8ClampedArray(this.canvas.width*this.canvas.height*4), this.canvas.width, this.canvas.height );
		}catch(e){
			this.data = this.context.createImageData(this.canvas.width, this.canvas.height);
		}
    },
    
    read:function(){
        this.data.data.set( this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data );
    },
    
    gpsToMerc:function(latitude, longitude, obj){
        obj = obj || this;
        var mapWidth = 256 * (1<<this.z), mapHeight = mapWidth, x, y, latRad, mercN;

        x = (longitude+180)*(mapWidth/360)
        
        latRad = latitude*Math.PI/180;
        mercN = Math.log( Math.tan( (Math.PI/4)+(latRad/2) ) );
        y     = (mapHeight/2)-(mapWidth*mercN/(2*Math.PI));
        
        obj.x = x;
        obj.y = y;
        return this;
    },
    
    generation:-1,
    update:function(latitude, longitude){
        if( latitude !== undefined && longitude !== undefined ){
            this.gpsToMerc(latitude, longitude);
            this.x /= 256;
            this.y /= 256;
        }
            
        var x=this.x, y=this.y, fx = x-Math.floor(x), fy = y-Math.floor(y);
        if( fx < 0.5 ) x=Math.floor(x)-1;
        else x=Math.floor(x);
        if( fy < 0.5 ) y=Math.floor(y)-1;
        else y=Math.floor(y);
        
        this.context.clearRect(0,0,256,256);
        this.fetchQuad(x, y);
    },
    
    fetchQuad:function(x, y){
        var gen=++this.generation;
        [
            {x:x,y:y},
            {x:x+1,y:y},
            {x:x+1,y:y+1},
            {x:x,y:y+1}
        ].forEach(c => {
            this.fetch(c, img=>this.pasteImage(gen, c, img))
        });
    },
    
    pasteImage:function(gen, coord, img){
        if( gen != this.generation ) return;
        var x = 128 + Math.floor(coord.x * 256 - this.x * 256);
        var y = 128 + Math.floor(coord.y * 256 - this.y * 256);
        this.context.drawImage( img, x, y );
        if( this.onUpdate ) this.onUpdate( this.canvas );
    },
    
    fetch:function(c, cb){
        var csrc = this.src;
        var props = {
            x:c.x,
            y:c.y,
            z:this.z,
            ext:this.ext
        }
        Object.keys(props).forEach((k) => csrc=csrc.replace("{" + k + "}", props[k] ));
        var src = csrc.replace("{s}", this.s);
        
        if( !this.cache ) this.cache = {};
        if( this.cache[csrc] ){
            if( this.cache[csrc] === true ) return;
            cb( this.cache[csrc] );
        }else{
            this.cache[csrc] = true;
            localforage.getItem(csrc, (err, arr) => {
                if( arr ) loadArr(arr);
                else DOC.getURL(src, (str) => {
                    var arr = new Uint8Array(str.length);
                    for(var i=0, l=str.length; i<l; ++i) arr[i] = str.charCodeAt(i);
                    
                    localforage.setItem(csrc, arr, ()=>{
                        loadArr(arr);
                    });
                }, {binary:true});
            })
            
            var loadArr = (arr)=>{
                    var url = URL.createObjectURL(new Blob([arr.buffer], {type:"image/"+this.ext}));
                    DOC.create("img", {onload:this.onLoadTile.bind(this, csrc, url, cb)}).src = url;
            };
        }
    },
    
    onLoadTile:function( csrc, url, cb, evt ){
        var img = evt.target;
        URL.revokeObjectURL(url);
        this.cache[csrc] = img;
        cb(img);
    }
});