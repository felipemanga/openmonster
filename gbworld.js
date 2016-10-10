CLAZZ({
    EXTENDS:"GO",
    PROVIDES:{"far.World":"singleton"},
    INJECT:{map:"GBMap", texture:"GBMap"},
    lonOff:0,
    latOff:0,
    lon:null,
    lat:null,
    tlon:null,
    tlat:null,
    velLon:0,
    velLat:0,
    trot:0,
    
    busy:false,
    
    bmd:null,
    sprite:null,
    
    group:null,
    grid:null,
    
    starter: false,
    
    CONSTRUCTOR:function(){
        SUPER();
        this.grid = {};

        this.texture.src = 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}';
        this.texture.onUpdate = this.map.onUpdate = this.onUpdateMap.bind(this);
        
        this.bmd = this.game.make.bitmapData(256,256);
        this.sprite = this.add(
            'image', 
            this.game.width*0.5, 
            this.game.height*0.5, 
            this.bmd
            );
        this.sprite.anchor.setTo(0.5);
        this.group = this.add("group");

        navigator.geolocation.watchPosition( this.poll.bind(this), undefined, { enableHighAccuracy: true });
        
        if(window.DeviceOrientationEvent)
            window.addEventListener('deviceorientation', this.onDOE.bind(this) );
    },
    
    onDOE:function(event) {
        var alpha;
        //Check for iOS property
        if(event.webkitCompassHeading) {
            alpha = event.webkitCompassHeading;
        }else{
            alpha = event.alpha;
            // alpha = alpha-270;
        }
        
        var currentAngle = this.sprite.rotation, angleTo = alpha/180*Math.PI;
        this.trot = Math.min( 
                        Math.abs( Math.abs(angleTo - currentAngle) - 2*Math.PI ), 
                        Math.abs( angleTo - currentAngle ) 
                    );
        this.trot = angleTo;
    },
    
    poll:function( geo ){
        this.busy = false;
        var lon = geo.coords.longitude,
            lat = geo.coords.latitude;

        if(this.lon === null){
            this.lon = lon;
            this.lat = lat;
        }

        this.tlon = lon;
        this.tlat = lat;
    },
    
    spawn:function(){
        if( this.tlon === null) return;
        
        this.tts = 3000;
        
        this.texture.read();
        var now = Math.floor(performance.now() / 5000),
            img = this.texture.data,
            k, 
            m = 10000,
            r = 26,
            slon = Math.round(this.lon*m)-r*0.5, 
            slat = Math.round(this.lat*m)-r*0.5,
            d = 5, 
            ngrid = {};
            
        for( var lon=slon; lon<slon+r; lon+=d ){
            for( var lat=slat; lat<slat+r; lat+=d ){
                k = lat + "," + lon;
                var seed = Math.abs(Math.sin( lon*49.4949 + lat*13.333 + now%(Math.PI*2) ) * 65535) % 1;
                var val = this.grid[ k ];
                if( val ) ngrid[k] = val;
                else if( !val && seed >= 0.9 ){
                    this.tts += 2000;
                    val = this.grid[k] = ngrid[k] = CLAZZ.get("Pomkey", {
                        seed: (seed - 0.9) * 10,
                        starter: this.starter,
                        spawnKey: k,
                        latitude: lat/m,
                        longitude: lon/m,
                        terrain: img
                    });
                }
            }
        }
    },
    
    unspawn:function( key ){
        delete this.grid[key];
    },
    
    onUpdateMap:function(){
        this.bmd.cls();
        if( !this.game.stage.filters ) this.bmd.copy( this.texture.canvas, 0, 0 );
        this.bmd.copy( this.map.canvas, 0, 0 );
    },
    
    cosR:0,
    sinR:0,
    
    tts:0,
    onTick:function( time ){
        this.tts -= time;
        this.sprite.rotation = this.trot; // this.sprite.rotation -= (this.sprite.rotation - this.trot) * 0.1;
        if(this.lon === null ) return;
        if( this.tts <= 0 ) this.spawn();
        
        this.cosR = Math.cos(this.sprite.rotation);
        this.sinR = Math.sin(this.sprite.rotation);
        this.velLon = ((this.tlon + this.lonOff*0.00001) - this.lon) * 0.1;
        this.velLat = ((this.tlat + this.latOff*0.00001) - this.lat) * 0.1;
        this.lon += this.velLon;
        this.lat += this.velLat;
        this.map.update( this.lat, this.lon );
        this.texture.update( this.lat, this.lon );
    },
    
    onRender:function(){
        if( this.lon == null ) return;
        this.group.children.forEach(c => {
            this.move( c, c.lat, c.lon );
        });
        this.group.sort('y', Phaser.Group.SORT_ASCENDING);
    },
    
    move:function(obj, lat, lon){
        if(lat===null || lat === undefined ) return;
        var cr = this.cosR, sr = this.sinR;

        this.map.gpsToMerc(lat, lon, obj);

        obj.x -= this.map.x * 256;
        obj.y -= this.map.y * 256;

        var x = cr*obj.x - sr*obj.y;
        var y = sr*obj.x + cr*obj.y;
        
        obj.x = Math.round( x + this.game.width*0.5 );
        obj.y = Math.round( y + this.game.height*0.5 );
    }
});
