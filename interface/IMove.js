CLAZZ("FS.INTERFACE.move", {
    type:null,
    Pwr:0,
    PP:0,
    Acc:100,

    use:function(a, t){
        if( this.applySEF(a, t) === false ) return false;
        if( this.applyTEF(a, t) === false ) return false;
        return true;
    },

    applySEF:function( a, t ){
        var md = a.moveData[ this.constructor.NAME ];
        if( !md ) md = a.moveData[ this.constructor.NAME ] = {PP:this.PP};
        if( md.PP <= 0 ) return false;
        md.PP--;
        return true;
    },

    applyTEF:function( a, t ){
        var mod = 1;
        if( a.data.types.indexOf(this.type) != -1 ) mod *= 2; // STAB
        var tc = CLAZZ.get("ITypeChart");
        t.data.types.forEach( (ttype) => mod *= tc.calc( this.type, ttype ) );
        var pwr = ( 2 * a.level + 10 ) / 250 * (a.Att / t.Def) + 2;
        pwr *= mod;
        if( this.Pwr ) t.HP -= this.Pwr * pwr;
        if( t.HP <= 0 ){
            t.HP = 0;
            t.alive = false;
        }
    }
});