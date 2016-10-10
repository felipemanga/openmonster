self.FS = self.FS || {URL:{}, FILE:{}, JSON:{}};
FS.JS = {};
FS.INTERFACE = {};

FS.mergeFS = function mergeFS( data, cb ){
	var zip = new JSZip();
	zip.loadAsync(data).then(loadZip);
	return;

	function loadZip( zip ){
		var w = new DOC.Wait( cb );
		Object.keys(zip.files).forEach((path) =>{
			var entry = zip.files[path];
			if( entry.dir ) return;
			entry.async("uint8array").then( w(d =>{
				var type = "";
				if( /^.*?(\.png$|\.jpg)$/i.test(path) ) 
					type = "image/png";
				else if( /^.*?(\.json)$/i.test(path) ){
					FS.JSON[path] = JSON.parse( bufferToStr(d) );
					return;
				}else if( /^.*?(\.clazz)$/i.test(path) ){
					FS.JS[path] = false;
					type = "text/javascript";
					var fqcn = path.replace(/\..*$/, "").replace(/\//g, ".");
					var ext = fqcn.replace(/\.[^.]+$/, "");
					if( ext in FS.INTERFACE )
						ext = "EXTENDS: FS.INTERFACE." + ext + ",\n";
					else ext = "";
					d = "CLAZZ('" + fqcn + "', {\n" + ext + bufferToStr(d) + "});";
					console.log("Found clazz", fqcn);
				}
				FS.FILE[path] = d;
				FS.URL[path] = URL.createObjectURL( new Blob( [ d ], {type:type}) );
			}));
		});
		w.start();
	}
}

function bufferToStr(buf){
    acc = "";
    for( i=0, l=buf.length; i<l; ++i )
        acc += String.fromCharCode(buf[i]);
	return acc;
}