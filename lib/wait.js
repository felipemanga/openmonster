CLAZZ("DOC.Wait", {
	cb:null,
	THIS:null,
	
	queue:1,
	
	CONSTRUCTOR:function( cb, THIS ){
		this.cb = cb;
		this.THIS = THIS;
	},
	
	start:function(){
		this.__hit();
	},
	
	__hit:function( cb ){
		this.queue--;
		if( cb ){
			var args = Array.prototype.slice.call(arguments, 1, arguments.length);
			cb.apply( null, args );
		}
		
		if( this.queue <= 0 && this.cb ){
			this.cb.call( this.THIS );
			this.cb = null;
		}
	},
	
	FUNCTION:function( callback, THIS ){
		this.queue++;
		return this.__hit.bind( this, callback && callback.bind(THIS || this.THIS) );
	}
	
});
