CLAZZ("gbfilter", {
    EXTENDS:Phaser.Filter,

    CONSTRUCTOR:function(game) {
        SUPER(game);
        this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2       vTextureCoord;", 
        "varying vec4       vColor;", 
        "uniform sampler2D  uSampler;", 
        "void main(void) {", 
            "gl_FragColor = texture2D(uSampler, vTextureCoord);", 
            "gl_FragColor.rgba = mix( vec4(1.), vec4(gl_FragColor.rgb, 1.), gl_FragColor.a );",
            "float l = 0.2126 * gl_FragColor.r + 0.7152 * gl_FragColor.g + 0.0722 * gl_FragColor.b;", 
            "l = floor( l*4. + 0.1 );",
            "     if(l<1.) gl_FragColor.rgba = vec4(30., 26., 3., 255.) / 255.;",
            "else if(l<2.) gl_FragColor.rgba = vec4(84., 46., 31., 255.) / 255.;",
            "else if(l<3.) gl_FragColor.rgba = vec4(127., 163., 112., 255.) / 255.;",
            "else          gl_FragColor.rgba = vec4(215., 234., 231., 255.) / 255.;",
        "}"
        ];
    }

});

CLAZZ({
    EXTENDS:Phaser.Filter,
    PROVIDES:{"KOFilter":"singleton"},

    CONSTRUCTOR:function(game) {
        SUPER(game);
        this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2       vTextureCoord;", 
        "varying vec4       vColor;",
        "uniform sampler2D  uSampler;", 
        "void main(void) {", 
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "vec4 ko = texture2D(uSampler, vec2(0.));",
            "if( gl_FragColor == ko ) gl_FragColor = vec4(0.);",
        "}"
        ];
    }

});
