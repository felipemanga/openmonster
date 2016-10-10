function start(){
    new Hello();
}

var Hello = CLAZZ({
    B:null,
    
    "CONSTRUCTOR":function(){
        var fpsEl = document.getElementById("FPS"), prevFPS = 0;
        var B = new PIG(document.getElementsByTagName("CANVAS")[0]);
        
        var img = document.createElement("img");
        img.src = FS.URL["A.png"];
        
        // http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
        /* */
        
        var s = 256;
        
        PIGShader.LIB["VN"] = [
                "float vn(vec2 n){ float a=0., w=1., iw=1024.; for(int i=0;i<"+Math.round(Math.log2(s))+";++i){",
                "vec2 m=n/iw, A=floor(m), B=A+1., F=fract(m); w *= 2.; iw *= 0.5;",
                "float v = mix( mix(rand(A.x,A.y), rand(B.x,A.y), F.x), mix(rand(A.x,B.y), rand(B.x,B.y), F.x), F.y );",
                "a+=v/w; } return a;}"
            ];
        
        var mesh = new PIGSquareMesh(s,s), mat = new PIGMaterial(new PIGShader({
            "VERTEX":[
                "#include rand, hl, VN, common, uvVTX, camera;",
                "uniform sampler2D Diffuse;",
                "uniform float ZXscale;",
                "varying vec4 color;",
                "void main(void){",
                    "vec2 err = mod(View[3].xz, ZXscale/"+s+".), off = View[3].xz - err;",
                    "vec2 p = ( (ZXscale*(position.xz)) + off );",
                    "float rough = hl(vn(p+2048.), 25.), height = vn(p);",
                    "position.y = mix( height*0.25+0.48, hl(height, 10.), rough );",
                    "position.xz -= err / ZXscale;",
                    "color=texture2D(Diffuse, vec2(0.5, position.y ) );",
                    "gl_Position = Projection*(View*(Model*position));",
                    "color.xyz *= vec3( hl(position.y, 5.) * pow((1. - gl_Position.z / (CameraFar - CameraNear)), 4.) );",
                "}"
                ],
            
            "FRAGMENT":[
                "precision mediump float;",
                "varying vec4 color;",
                "void main(void){",
                    "gl_FragColor = color;",
                "}"]
        }));
        
        var i, seed = mat.setUniform("float seed", (Math.random()*performance.now())%1 );
        var ZXscale = mat.setUniform("float ZXscale", 2000);
        mat.setUniform("sampler2D Diffuse", img);

        var obj = new PIGObject(mesh, mat);
        B.scene.addChild(obj);
        
        obj.setScale(ZXscale.value, 256, ZXscale.value);
        B.camera.setPosition(0, 320, 0);
        
        /*/
        
        var square = new PIGSquareMesh(), mat = new PIGMaterial();
        mat.setUniform("sampler2D Diffuse", img);
        
        // B.camera.setPosition(0, 0, 12);
        for( var i=0; i<10; ++i ){
            obj = new PIGObject(square, mat);
            obj.setPosition(Math.random()*6-3, 50, Math.random()*6-3);
            obj.setRotation(Math.random(), Math.random(), 0);
            obj.setScale(100,100,100);
            B.scene.addChild(obj);
        }
        
        /* */
        
        
        i = 0;
        var rf = 0;
        B.autoUpdate( () => {
            if( Math.round(B.FPS) != prevFPS && !(rf++%10) ){
                prevFPS = Math.round(B.FPS);
                fpsEl.textContent = prevFPS + " FPS";
            }
            
            i+=0.01;
            
            //*
            B.camera.x = Math.sin(i)*200;
            B.camera.z = (i)*1000;
            
            B.camera.setRotation(B.camera.x, 200, B.camera.z+300);

            obj.x = B.camera.x - obj.sx*0.5;
            obj.z = B.camera.z;

            /*
            for( var j=1, jl=B.scene.children.length; j<jl; ++j ){
                var obj = B.scene.children[j];
                obj.rotY += Math.sin(i*Math.PI) * 0.01;
                obj.rotZ += Math.cos(obj.rotY*Math.PI) * 0.05; 
                obj.x = Math.cos(obj.rotZ) * 5;
                obj.z = Math.sin(obj.rotZ) * 5;
            };
            */
        });
    }
});

if( document.readyState == "complete" ) start();
else document.addEventListener("DOMContentLoaded", start);