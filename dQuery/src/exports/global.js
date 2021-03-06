define( [
	"../core",
], function( jQuery, noGlobal ) {

"use strict";

var

	// Map over jQuery in case of overwrite
	_jQuery = window.dQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.dQuery === jQuery ) {
		window.dQuery = _jQuery;
	}

	return jQuery;
};


// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( !noGlobal ) {
	jQuery.onload=function(cb){
		if(document.readyState=="complete"){
			cb();
		}else {
			jQuery(window).load(function(){
				cb();
			})
		}
	}
	window.dQuery  = jQuery;
	window.dQuery.noConflict();

}

} );
