
/*! litejs.com/MIT-LICENSE.txt */

/* global location */

// With initial congestion window set to 2 and 1452 bytes of data in a segment.
//  - 1 round trip to get 2904 bytes, Initial Window (IW) = 2
//  - 2 round trips to get 8712 bytes, Congestion Window (CW) = 4
//  - 3 round trips to get 20328 bytes, CW = 8
//  - 4 round trips to get 43560 bytes, CW = 16
//
// Dynamically created scripts are async by default.
// HTML5 declared that scripts with an unrecognised type should not be downloaded.
//
// IE9 and below allows up to 32 stylesheets, this was increased to 4095 in IE10.
//
// Invalidate a URL in the browser's cache by sending a PUT method xmlhttprequest to it:
// xhr("PUT", url).send(null) Works in all major browsers


!function(window, Function) {
	xhr._s = new Date()
	var rewrite = {
		//!{loadRewrite}
	}
	// Move setTimeout from window.prototype to window object for future patching in IE9.
	// Fallback to global.setTimeout and expose xhr._c for tests.
	, setTimeout_ = (window.setTimeout = window.setTimeout) /*** debug ***/ || setTimeout
	, loaded = xhr._c = {}
	/*/
	, loaded = {}
	/**/

	/*** activex ***/
	// XMLHttpRequest in IE7-8 do not accept PATCH, use ActiveX.
	// IE disallows adding custom properties to ActiveX objects and read/write readystatechange after send().
	, XMLHttpRequest = +"\v1" && window.XMLHttpRequest || Function("return new ActiveXObject('Microsoft.XMLHTTP')")
	/**/

	, execScript =
		// IE5-10, Chrome1-12
		window.execScript ||
	/*** inject ***/
		// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
		// In case of local execution `e('eval')` returns undefined
		Function("e,eval", "try{return e('eval')}catch(e){}")(eval) ||
		Function("a", "var d=document,b=d.body,s=d.createElement('script');s.text=a;b.removeChild(b.insertBefore(s,b.firstChild))")
	/*/
		eval
	/**/

	/*** reuse ***/
	// XHR memory leak mitigation
	, xhrs = []
	/**/

	/*** onerror ***/
	, lastError
	, unsentErrors = xhr._e = []
	, onerror = window.onerror = function(message, file, line, col, error) {
		// Do not send multiple copies of the same error.
		// file = document.currentScript.src || import.meta.url
		if (lastError !== (lastError =
			[ file
			, line
			, col || (window.event || unsentErrors).errorCharacter || "?"
			, message
			].join(":")
		) && 2 > unsentErrors.push(
			[ +new Date()
			, lastError
			, error && (error.stack || error.stacktrace) || "-"
			, "" + location
			]
		)) setTimeout_(sendErrors, 307)
	}

	function sendErrors() {
		if (xhr.err) {
			xhr.err(unsentErrors)
		} else {
			setTimeout_(sendErrors, 1307)
		}
	}
	/*/
	, onerror = nop
	/**/

	// next === true is for sync call

	window.xhr = xhr
	function xhr(method, url, next, attr1, attr2) {
		var req = /*** reuse ***/ xhrs.pop() || /**/ new XMLHttpRequest()

		// To be able to reuse the XHR object properly,
		// use the open method first and set onreadystatechange later.
		// This happens because IE resets the object implicitly
		// in the open method if the status is 'completed'.
		// MSXML 6.0 fixed that
		//
		// The downside to calling the open method after setting the callback
		// is a loss of cross-browser support for readystates.
		// http://www.quirksmode.org/blog/archives/2005/09/xmlhttp_notes_r_2.html

		// function progress(ev) {
		// 	if (ev.lengthComputable) {
		// 		var percentComplete = (ev.loaded / ev.total) * 100
		// 	}
		// }
		// req.upload.addEventListener("progress", onProgressHandler)
		// req.addEventListener("progress", onProgressHandler)
		// req.onprogress = progress

		// Vodafone 360 doesn't pass session cookies, so they need to be passed manually
		// if (sessionID) req.setRequestHeader("Cookie", sessionID);
		// if (req.getResponseHeader("Set-Cookie")) sessionID = req.getResponseHeader("Set-Cookie");

		req.open(method, rewrite[url] || url, next !== true)

		// With IE8 XMLHttpRequest gains the timeout property (length of time in milliseconds).
		// req.timeout = 10000
		// req.ontimeout = timeoutRaised

		if (next !== true) req.onreadystatechange = function() {
			if (req.readyState > 3) {
				// From the XMLHttpRequest spec:
				//
				// > For 304 Not Modified responses
				// > that are a result of a user agent generated conditional request
				// > the user agent must act as if the server gave a 200 OK response
				// > with the appropriate content.
				//
				// In other words, the browser will always give status code 200 OK,
				// even for requests that hit the browser cache.
				//
				// However, the spec also says:
				//
				// > The user agent must allow author request headers
				// > to override automatic cache validation
				// > (e.g. If-None-Match or If-Modified-Since),
				// > in which case 304 Not Modified responses must be passed through.
				//
				// So, there is a workaround to make the 304 Not Modified responses visible
				// to your JavaScript code.
				//
				//   - Opera 8.x passes 304
				//   - IE9 returns 1223 and drop all response headers from PUT/POST
				//     when it should be 204,
				//     http://www.enhanceie.com/ie/bugs.asp
				//   - File protocol and Appcache returns status code 0
				//   - Android 4.1 returns status code 0 when cache manifest is used
				//   - IE 10-11 returns status code 0 with CORS for codes 401, 403
				//     Fix: Internet options -> Trusted sites -> Custom Level ->
				//          Miscellaneous -> Access data sources across domains -> Enable
				//   - Use custom status code 1 for network error

				method = req.status || (req.responseText ? 200 : 1)
				if (next) next.call(
					req,
					(method < 200 || method > 299 && method != 304 && method != 1223) && method,
					req.responseText,
					url,
					attr1,
					attr2
				)
				req.onreadystatechange = next = nop
				/*** reuse ***/
				xhrs.push(req)
				/**/
			}
		}
		return req
	}


	/*** load ***/
	xhr.load = load
	function load(files, next, raw) {
		files = [].concat(files)
		var file
		, pos = 0
		, len = files.length
		, res = []

		for (; pos < len; pos++) if ((file = files[pos])) {
			if (loaded[file] === 2) files[pos] = 0
			else if (loaded[file]) {
				// Same file requested again before responce
				;(loaded[file].x || (loaded[file].x = [])).push(exec, res, pos)
			} else {
				// FireFox 3 throws on `xhr.send()` without arguments
				xhr("GET", file, loaded[file] = cb, pos).send(null)
			}
		}
		exec(pos = 0)

		function cb(err, str, fileName, filePos) {
			loaded[fileName] = 2
			res[filePos] = err ? (onerror(err, fileName), "") : str
			exec()
		}
		function exec() {
			if (res[pos]) {
				if (raw) {
					files[pos] = 0
				} else {
					try {
						var execResult = (xhr[files[pos].replace(/[^?]+\.|\?.*/g, "")] || execScript)(res[pos])
						if (execResult && execResult.then) {
							res[pos] = 0
							return execResult.then(function() {
								res[pos] = ""
								exec()
							})
						}
					} catch(e) {
						onerror(e, files[pos])
					}
					res[pos] = ""
				}
			}
			if (res[pos] === "" || !files[pos]) {
				if (++pos < len) exec()
				/*** inject ***/
				// inject can be async
				else if (pos === len && execScript !== eval) setTimeout_(exec, 1)
				/**/
				else {
					if (next) next(res)
					if ((next = cb.x)) {
						for (pos = 0; next[pos]; ) next[pos++](next[pos++][next[pos++]] = "")
					}
				}
			}
		}
	}

	load([
		//!{loadFiles}
	])
	/**/

	function nop() {}
}(this, Function) // jshint ignore:line


/* litejs.com/MIT-LICENSE.txt */


// IE5 does not support
//  - Array#push/pop
//  - Function#call
//  - encodeURIComponent
//  - RegExp lookahead /(?=a)/ and non-greedy modifiers /a+?/
//  - if ("key" in map) and hasOwnProperty

// IE5.5-IE7 patched 56
// "Event","pointer","sessionStorage","localStorage","requestAnimationFrame","cancelAnimationFrame","console","matchMedia","JSON","setTimeout","setInterval","g:parseInt","parseInt","parseFloat","isNaN","isFinite","isInteger","MAX_SAFE_INTEGER","isSafeInteger","d:now","toJSON","toISOString","bind","assign","create","entries","hasOwn","keys","values","toString","isArray","from","of","includes","indexOf","lastIndexOf","reduce","reduceRight","splice","every","forEach","map","filter","some","flat","flatMap","endsWith","startsWith","trim","sendBeacon","matches","querySelector","querySelectorAll"


/* global El, xhr, escape */
/* c8 ignore start */
!function(window, Date, Function, Infinity, P) {

	// Array#flat()         - Chrome69, Edge79, Firefox62, Safari12
	// window.PointerEvent  - Chrome55, Edge12, Firefox59, Safari13,   IE11
	// navigator.sendBeacon - Chrome39, Edge14, Firefox31, Safari11.1
	// Object.fromEntries   - Chrome73, Edge79, Firefox63, Safari12.1, Opera60, Node.js12.0.0
	// queueMicrotask       - Chrome71, Edge79, Firefox69, Safari12.1

	var UNDEF, isArray, oKeys
	, O = window
	, patched = (window.xhr || window)._p = []
	, jsonRe = /[\x00-\x1f\x22\x5c]/g
	, JSONmap = {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\"":"\\\"","\\":"\\\\"}
	, hasOwn = JSONmap.hasOwnProperty
	, esc = escape
	, _parseInt = parseInt
	/*** debug ***/
	, IS_NODE = !window.document
	, document = patch("document", {body:{},documentElement:{}})
	, location = patch("location", {href:""})
	, navigator = patch("navigator")
	/*/
	, document = window.document
	, IS_NODE = false
	/**/
	, html = document.documentElement
	, body = document.body
	// JScript engine in IE<9 does not recognize vertical tabulation character
	// The documentMode is an IE only property, supported from IE8
	, a = document.documentMode | 0
	, b = "setInterval"
	, setInterval = (window[b] = window[b])
	, c
	, ie678 = !+"\v1" && a < 9 // jshint ignore:line
	, ie6789 = ie678 || a == 9
	, ie67 = ie678 && a < 8
	, EV = "Event"
	, Event = patch(
		EV,
		"c=F.createEventObject(event),b=c.buttons=c.button;c.button=b==1?0:b==4?1:b;c.preventDefault=X;c.stopPropagation=Y;c.target=c.srcElement;c.type=a;return c",
		!isFn(O[EV]) && document,
		Function("this.returnValue=!1"),
		Function("this.cancelBubble=this.cancel=!0")
	)
	, wheelDiff = 120
	, wheelEv = (
		"onwheel" in document      ? "wheel" :      // Modern browsers
		"onmousewheel" in document ? "mousewheel" : // Webkit and IE
		"DOMMouseScroll"                            // older Firefox
	)
	, fixEv = Event.fixEv = {
		wheel: wheelEv
	}
	, fixFn = Event.fixFn = {
		wheel: wheelEv !== "wheel" && function(el, fn) {
			// DOMMouseScroll Firefox 1 MouseScrollEvent.detail - number of lines to scroll (-32768/+32768 = page up/down)
			return function(e) {
				var delta = (e.wheelDelta || -e.detail || -e.deltaY) / wheelDiff
				if (delta) {
					if (delta < 1 && delta > -1) {
						var diff = (delta < 0 ? -1 : 1) / delta
						delta *= diff
						wheelDiff /= diff
					}
					//TODO: fix event
					// e.deltaY =
					// e.deltaX = - 1/40 * e.wheelDeltaX|0
					fn.call(el, e, delta)
				}
			}
		}
	}
	, MS = "MSPointer"
	, DOWN = "pointerdown"
	, MOVE = "pointermove"
	, UP = "pointerup"
	, CANCEL = "pointercancel"
	, touchMap = {
		d: "touchstart",
		m: "touchmove",
		u: "touchend",
		c: "touchcancel"
	}

	, lastHash
	, onhashchange = "onhashchange"


	// Patch parameters support for setTimeout callback
	patch("setTimeout", (a = "return O(X(a)&&A.length>2?a.apply.bind(a,null,S.call(A,2)):a,b)"), ie6789, isFn)
	// b = "setInterval"
	patch(b, a, ie6789, isFn)

	// 20 fps is good enough
	patch("request" + (a = "AnimationFrame"), "return setTimeout(a,50)")
	// window.mozRequestAnimationFrame    || // Firefox 4-23
	// window.webkitRequestAnimationFrame || // Chrome 10-24
	// window.msRequestAnimationFrame     || // IE 10 PP2+
	patch("cancel" + a, "clearTimeout(a)")


	if (!IS_NODE && !(onhashchange in window) || ie67) {
		patch(onhashchange, null)
		setInterval(function() {
			if (lastHash !== (lastHash = location.href.split("#")[1]) && isFn(window[onhashchange])) {
				window[onhashchange]()
			}
		}, 60)
	}

	// Missing PointerEvents with Scribble enable on Safari 14
	// https://mikepk.com/2020/10/iOS-safari-scribble-bug/
	// https://bugs.webkit.org/show_bug.cgi?id=217430
	if (!window.PointerEvent) {
		// IE10
		if (window[MS + EV]) {
			patched.push("pointer:MS")
			fixEv[DOWN] = MS + "Down"
			fixEv[MOVE] = MS + "Move"
			fixEv[UP] = MS + "Up"
			fixEv[CANCEL] = MS + "Cancel"
		} else {
			patched.push("pointer")

			fixEv[DOWN] = "mousedown"
			fixEv[MOVE] = "mousemove"
			fixEv[UP] = "mouseup"
			fixEv[CANCEL] = "mouseup"

			fixFn[DOWN] =
			fixFn[MOVE] =
			fixFn[UP] =
			fixEv[CANCEL] = function(el, _fn, ev) {
				var blockMouse
				if (window.TouchEvent) {
					// Calling preventDefault on a touchstart or the first touchmove event of a series
					// prevents the corresponding mouse events from firing.
					//
					// chrome://flags/ Touch Events API
					El.on(el, touchMap[ev[7]], touchToPointer)
					mouseToPointer._rm = El.off.bind(el, el, touchMap[ev[7]], touchToPointer)
				}
				return mouseToPointer
				function mouseToPointer(e) {
					if (blockMouse) {
						return
					}
					if (!e.target) e.target = el
					e.pointerId = 1
					e.pointerType = "mouse"
					e.width = e.height = 1
					e.pressure = e.type == "mouseup" ? 0 : 0.5
					if (el.setCapture) {
						if (e.type == "mousedown") el.setCapture(true)
						if (e.type == "mouseup") document.releaseCapture()
					}
					_fn.call(el, e)
				}
				function touchToPointer(e) {
					var touch
					, touches = e.changedTouches
					, preventDefault = e.preventDefault.bind(e)
					, stopPropagation = e.stopPropagation.bind(e)
					, i = 0
					for (; (touch = touches[i++]); ) {
						touch.pointerId = touch.identifier + 2
						touch.pointerType = "touch"
						touch.width = 2 * (touch.radiusX || touch.webkitRadiusX || 0)
						touch.height = 2 * (touch.radiusY || touch.webkitRadiusY || 0)
						touch.pressure = touch.force || touch.webkitForce || 0.5
						touch.preventDefault = preventDefault
						touch.stopPropagation = stopPropagation
						_fn.call(el, touch)
					}
					blockMouse = e.touches[0]
				}
			}
		}
	}

	function createStorage(name) {
		try {
			// FF4-beta with dom.storage.enabled=false throws for accessing windows.localStorage
			// iOS5 private browsing throws for localStorage.setItem()
			window[name += "Storage"].setItem(name, name)
			return window[name].removeItem(name)
		} catch(e){}

		// # IE5 128KB per document
		//
		// The `saveHistory` behavior persists data only for the current session,
		// using one in-memory UserData store for the entire document.
		// If two elements write the same attribute, the first is overwritten.
		//
		// The `userData` behavior persists data across sessions,
		// using one UserData store for each object, saved in the cache.
		// Saved UserData can be reloaded even if the document has been closed and reopened.
		//
		// An ID is required for userData and saveSnapshot behaviors
		// and recommended for saveHistory and saveFavorite behaviors.
		//
		// https://msdn.microsoft.com/en-us/library/ms531348(v=vs.85).aspx
		// if (el.addBehavior) {
		// el.style.behavior = surviveReboot ? "url('#default#userData')" : "url('#default#saveHistory')"
		// el.addBehavior("#default#" + (surviveReboot ? "userData" : "saveHistory"))
		// if (surviveReboot) el.load("persist")
		// value = el.getAttribute(key)
		// save = function() {
		// 	el.setAttribute(key, El.val(el))
		// 	if (surviveReboot) el.save("persist")
		// }
		var data = {
			setItem: function(id, val) {
				return (data[id] = "" + val)
			},
			getItem: function(id) {
				return data[id]
			},
			removeItem: function(id) {
				delete data[id]
			},
			clear: function() {
				for (var key in data) delete data[key]
			}
		}
		patch(name, data, 1)
	}

	createStorage("session")    // Chrome5, FF2, IE8, Safari4
	createStorage("local")      // Chrome5, FF3.5, IE8, Safari4

	// IE8 has console, however, the console object does not exist if the console is not opened.
	patch("console", {log: nop, error: nop})

	patch("getComputedStyle", "return a.currentStyle")

	/*** ie9 ***/
	patch("matchMedia", "b=a||'all';return{media:b,matches:X?X.matchMedium(b):!1,addListener:Y}", 0, window.styleMedia || window.media, nop)
	/**/

	function jsonFn(str) {
		return JSONmap[str] || esc(str).replace(/%u/g, "\\u").replace(/%/g, "\\x")
	}

	patch("JSON", {
		parse: function(t) {
			return Function("return(" + t + ")")()
		},
		stringify: function stringify(o) {
			// IE 8 serializes `undefined` as `"undefined"`
			return (
				isStr(o) ? "\"" + o.replace(jsonRe, jsonFn) + "\"" :
				o !== o || o == null || o === Infinity || o === -Infinity ? "null" :
				typeof o == "object" ? (
					isFn(o.toJSON) ? stringify(o.toJSON()) :
					isArray(o) ? "[" + o.map(stringify) + "]" :
					"{" + oKeys(o).flatMap(function(key) {
						return o[key] === void 0 ? [] : stringify(key) + ":" + stringify(o[key])
					}) + "}"
				) :
				"" + o
			)
		}
	}, ie678)

	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	patch("escape", "return X(a)", esc("a", 0) != "a", esc)

	// From Chrome23/Firefox21 parseInt parses leading-zero strings as decimal, not octal
	b = patch("g:parseInt", "return X(a,(b>>>0)||(Y.test(''+a)?16:10))", _parseInt("08") !== 8, _parseInt, /^\s*[-+]?0[xX]/)

	O = Number
	patch("parseInt", b)
	patch("parseFloat", parseFloat)
	patch("isNaN", "return a!==a")
	patch("isInteger", "return X(a)&&Math.floor(a)===a", 0, patch("isFinite", "return typeof a==='number'&&isFinite(a)"))
	patch("isSafeInteger", "return a<=X", 0, patch("MAX_SAFE_INTEGER", 9007199254740991))

	O = Date
	patch("now", "return+new Date")

	/*** toISOString ***/
	O = O[P]
	// IE8 toJSON does not return milliseconds
	// FF37 returns invalid extended ISO-8601, `29349-01-26T00:00:00.000Z` instead of `+029349-01-26T00:00:00.000Z`
	b = O[a = "toISOString"] && new Date(8e14)[a]().length < 27 || ie678
	patch(a, patch("toJSON", [
		"a=t.getUTCFullYear();if(a!==a)throw RangeError('Invalid time');return(b=a<0?'-':a>9999?'+':'')+X(a<0?-a:a,'-',b?6:4", "Month()+1,'-'", "Date(),'T'",
		"Hours(),':'", "Minutes(),':'", "Seconds(),'.'", "Milliseconds(),'Z',3)"
	].join(")+X(t.getUTC"),
		b,
		function(num, append, len) {
			return ("00000" + num).slice(-len || -2) + append
		}
	), b)
	/**/

	O = Function[P]
	// Chrome7, FF4, IE9, Opera 11.60, Safari 5.1.4
	patch("bind", "b=S.call(A,1);c=function(){return t.apply(this instanceof c?this:a,b.concat(S.call(arguments)))};if(t[P])c[P]=t[P];return c")

	O = Object
	patch("assign", "for(var k,i=1,l=A.length;i<l;)if(t=A[i++])for(k in t)if(o.call(t,k))a[k]=t[k];return a")
	patch("create", "X[P]=a||Y;return new X", 0, nop, {
		// oKeys is undefined at this point
		constructor: oKeys,
		hasOwnProperty: oKeys, // jshint ignore:line
		isPrototypeOf: oKeys, propertyIsEnumerable: oKeys,
		toLocaleString: oKeys, toString: oKeys, valueOf: oKeys
	})
	a = "c=[];for(b in a)o.call(a,b)&&c.push("
	b = ");return c"
	patch("entries", a + "[b,a[b]]" + b)
	patch("hasOwn", "return!!(a&&o.call(a,b))")
	oKeys = patch("keys", a + "b" + b)
	patch("values", a + "a[b]" + b)
	//patch("fromEntries", "for(a=a.entries(),c={};!(b=a.next()).done;c[b[0]]=b[1]" + b)

	a = O[P][b = "toString"]
	O = Error[P]
	// in IE8 Error("1") creates {description: "", message: "", name: "Error", number: 1}
	patch(b, "a=t.message||t.number;return a?X+': '+a:X", Error(1) != "Error: 1", "Error")
	O = Array
	isArray = patch("isArray", "return X.call(a)==='[object Array]'", 0, a)

	// TODO:2021-02-25:lauri:Accept iterable objects
	//patch("from", "a=S.call(a);return b?a.map(b,c):a")
	patch("from", "a=X(a)?a.split(''):b?a:S.call(a);return b?a.map(b,c):a", 0, isStr)
	patch("of", "return S.call(A)")

	O = O[P]
	a = "var l=t.length,o=[],i=-1;"
	b = "i+=b|0;while(++i<l)"
	c = "if(t[i]===a)return i;return -1"
	patch("includes",    a + b + "if(t[i]===a||(a!==a&&t[i]!==t[i]))return!0;return!1")
	patch("indexOf",     a + b + c)
	patch("lastIndexOf", a + "i=(b|0)||l;i>--l&&(i=l)||i<0&&(i+=l);++i;while(--i>-1)" + c)

	b = a + "if(A.length<2)b=t"
	c = "b=a(b,t[i],i,t);return b"
	patch("reduce",      b + "[++i];while(++i<l)" + c)
	patch("reduceRight", b + "[--l];i=l;while(i--)" + c)

	// Safari12 bug, any modification to the original array before calling `reverse` makes bug disappear
	// Fixed in Safari 12.0.1 and iOS 12.1 on October 30, 2018
	// patch("reverse",     "if(X(t))t.length=t.length;return O.call(t)", "2,1" != [1, 2].reverse(), isArray)

	// In ES3 the second deleteCount argument is required, IE<=8 requires deleteCount
	// IE6-9 silently fails to write to the arguments object, make it to array first.
	patch("splice",      "if(b===Y){A=S.call(A);A[1]=t.length-a}return O.apply(t,A)", "1,2" != [1, 2].splice(0))

	b = a + "while(++i<l)"
	patch("every",       b + "if(!a.call(b,t[i],i,t))return!1;return!0")
	patch("forEach",     b + "a.call(b,t[i],i,t)")

	c = ";return o"
	patch("map",         b + "o[i]=a.call(b,t[i],i,t)" + c)

	b += "if(a.call(b,t[i],i,t))"
	patch("filter",      b + "o.push(t[i])" + c)
	patch("some",        b + "return!0;return!1")

	patch("flat",        "return a<1?S.call(t):(b=t.concat.apply([],t))&&a>1&&b.some(X)?b.flat(a-1):b", 0, isArray)
	patch("flatMap",     "return X.apply(t,A).flat()", 0, O.map)
	//patch("entries", "a=this;b=-1;return{next:function(){c=a.length<=++b;return{done:c,value:c?void 0:a[b]}}}")


	O = String[P]
	patch("endsWith", "return(a+='')===t.slice(-a.length)")
	patch("startsWith", "return t.lastIndexOf(a,0)===0")
	patch("trim", "return t.replace(/^\\s+|\\s+$/g,'')")


	O = navigator
	patch("sendBeacon", function(url, data) {
		// The synchronous XMLHttpRequest blocks the process of unloading the document,
		// which in turn causes the next navigation appear to be slower.
		url = xhr("POST", url, xhr.unload)
		url.setRequestHeader("Content-Type", "text/plain;charset=UTF-8")
		url.send(data)
	})

	// The HTML5 document.head DOM tree accessor
	// patch("head", document.getElementsByTagName("head")[0])
	// HTMLElement (IE9) -> Element (IE8)
	O = html
	var selectorCache = {}
	, selectorRe = /([.#:[])([-\w]+)(?:\(((?:[^()]|\([^)]+\))+?)\)|([~^$*|]?)=(("|')(?:\\.|[^\\])*?\6|[-\w]+))?]?/g
	, selectorLastRe = /([\s>+~]*)(?:("|')(?:\\.|[^\\])*?\2|\((?:[^()]|\([^()]+\))+?\)|~=|[^'"()\s>+~])+$/
	, selectorSplitRe = /\s*,\s*(?=(?:[^'"()]|"(?:\\.|[^\\"])*?"|'(?:\\.|[^\\'])*?'|\((?:[^()]|\([^()]+\))+?\))+$)/
	, selectorMap = {
		"empty": "!_.lastChild",
		"enabled": "!m(_,':disabled')",
		"first-child": "(a=_.parentNode)&&a.firstChild==_",
		"lang": "m(c(_,'[lang]'),'[lang|='+v+']')",
		"last-child": "(a=_.parentNode)&&a.lastChild==_",
		"link": "m(_,'a[href]')",
		"only-child": "(a=_.parentNode)&&a.firstChild==a.lastChild",
		".": "~_.className.split(/\\s+/).indexOf(a)",
		"#": "_.id==a",
		"^": "!a.indexOf(v)",
		"|": "a.split('-')[0]==v",
		"$": "a.slice(-v.length)==v",
		"~": "~a.split(/\\s+/).indexOf(v)",
		"*": "~a.indexOf(v)",
		">>": "m(_.parentNode,v)",
		"++": "m(_.previousSibling,v)",
		"": "c(_.parentNode,v)"
	}
	, closest = patch("closest", walk.bind(window, "parentNode", 1))
	, matches = patch("matches", "return!!X(a)(t)", 0, selectorFn)

	// The addEventListener is supported in Internet Explorer from version 9.
	// https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
	// - IE8 always prevents the default of the mousewheel event.
	patch("addEventListener", "return(t.attachEvent('on'+a,b=X(t,a,b)),b)", 0, function(el, ev, fn) {
		return function() {
			var e = new Event(ev)
			if (e.clientX !== UNDEF) {
				e.pageX = e.clientX + (window.pageXOffset || html.scrollLeft || body.scrollLeft || 0)
				e.pageY = e.clientY + (window.pageYOffset || html.scrollTop || body.scrollTop || 0)
			}
			fn.call(el, e)
		}
	})
	patch("removeEventListener", "t.detachEvent('on'+a,b)")

	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	patch((a = "querySelector"), (b = "return X(t,a,Y)"), ie678, find, 1)
	patch(a + "All", b, ie678, find, 0)


	function selectorFn(str) {
		if (str != null && !isStr(str)) throw Error("Invalid selector")
		return selectorCache[str || ""] ||
		(selectorCache[str] = Function("m,c", "return function(_,v,a,b){return " +
			str.split(selectorSplitRe).map(function(sel) {
				var relation, from
				, rules = ["_&&_.nodeType==1"]
				, parentSel = sel.replace(selectorLastRe, function(_, _rel, quote, start) {
					from = start + _rel.length
					relation = _rel.trim()
					return ""
				})
				, tag = sel.slice(from).replace(selectorRe, function(_, op, key, subSel, fn, val, quotation) {
					rules.push(
						"((v='" +
						(subSel || (quotation ? val.slice(1, -1) : val) || "").replace(/[\\']/g, "\\$&") +
						"'),(a='" + key + "'),1)"
						,
						selectorMap[op == ":" ? key : op] ||
						"(a=_.getAttribute(a))" +
						(fn ? "&&" + selectorMap[fn] : val ? "==v" : "!==null")
					)
					return ""
				})

				if (tag && tag != "*") rules[0] += "&&_.tagName=='" + tag.toUpperCase() + "'"
				if (parentSel) rules.push("(v='" + parentSel + "')", selectorMap[relation + relation])
				return rules.join("&&")
			}).join("||") + "}"
		)(matches, closest))
	}
	function walk(next, first, el, sel, nextFn) {
		sel = selectorFn(sel)
		for (var out = []; el; el = el[next] || nextFn && nextFn(el)) if (sel(el)) {
			if (first) return el
			out.push(el)
		}
		return first ? null : out
	}

	function find(node, sel, first) {
		return walk("firstChild", first, node.firstChild, sel, function(el) {
			for (var next = el.nextSibling; !next && ((el = el.parentNode) !== node); ) next = el.nextSibling
			return next
		})
	}


	// ie6789
	// The documentMode is an IE only property, supported from IE8.
	if (ie678) {
		try {
			// Remove background image flickers on hover in IE6
			// You could also use CSS
			// html { filter: expression(document.execCommand("BackgroundImageCache", false, true)); }
			document.execCommand("BackgroundImageCache", false, true)
		} catch(e){}
	}

	function isFn(value) {
		return typeof value === "function"
	}
	function isStr(value) {
		return typeof value === "string"
	}
	function nop() {}

	function patch(key_, src, force, arg1, arg2) {
		var key = key_.split(":").pop()
		return !force && O[key] || (O[patched.push(key_), key] = (
			isStr(src) ?
			Function("o,O,P,S,F,X,Y", "return function(a,b,c){var t=this,A=arguments;" + src + "}")(hasOwn, O[key], P, patched.slice, force, arg1, arg2) :
			src === UNDEF ? {} :
			src
		))
	}
}(this, Date, Function, Infinity, "prototype") // jshint ignore:line
/* c8 ignore stop */




/* litejs.com/MIT-LICENSE.txt */

!function(exports, _setTimeout, _clearTimeout, _Date, _Error, _Infinity) {
	var started, testSuite, timerType, inSuite
	, tests = []
	, describe = exports.describe = curry(def, 1)
	, _global = describe.global = exports.window || global
	, _process = _global.process || /* c8 ignore next */ { exit: This }
	, _isArray = Array.isArray
	, _keys = Object.keys
	, call = def.bind.bind(def.call)
	, slice = call(tests.slice)
	, push = call(tests.push)
	, lineRe = /{(\w+)}/g
	, totalCases = 0
	, failedCases = []
	, totalAsserts = 0
	, passedAsserts = 0
	, skipped = 0
	, runPos = 0
	, splicePos = 0
	, assert = describe.assert = {
		notOk: function(value, message) {
			return this(!value, message || "!=", value, "falsy")
		},
		equal: function(actual, expected, message) {
			return this(
				arguments.length > 1 && _deepEqual(actual, expected, []),
				message || "equal", actual, expected
			)
		},
		notEqual: function(actual, expected, message) {
			return this(
				arguments.length > 1 && !_deepEqual(actual, expected, []),
				message || "notEqual", actual, expected
			)
		},
		skip: This,
		strictEqual: function(actual, expected, message) {
			return this(
				arguments.length > 1 && actual === expected,
				message || "===", actual, expected
			)
		},
		notStrictEqual: function(actual, expected, message) {
			return this(
				arguments.length > 1 && actual !== expected,
				message || "!==", actual, expected
			)
		},
		own: function(actual, expected, message) {
			own.lastMsg = ""
			return this(own(actual, expected), message || own.lastMsg)
		},
		notOwn: function(actual, expected, message) {
			own.lastMsg = ""
			return this(!own(actual, expected), message || own.lastMsg)
		},
		throws: function(fn, message) {
			var actual = false
			try {
				fn()
			} catch(e) {
				actual = true
			}
			return this(actual, message || "throws", actual, true)
		},
		type: function(thing, expected, message) {
			var actual = type(thing)
			return this(actual === expected, message || "type", actual, expected)
		},
		anyOf: function(a, b, message) {
			return this(
				_isArray(b) && b.indexOf(a) > -1,
				message || "anyOf", a, b
			)
		}
	}
	, argv = _process.argv && _process.argv.slice(2) || /* c8 ignore next */ []
	, conf = describe.conf = opts(argv, {
		// process.platform === 'win32' -> √×.
		file: (_Error().stack + " /cli/test.js:").match(/\S+?:(?=[:\d)]*$)/m)[0],
		global: "describe,it,test",
		head: "",
		indent: "  ",
		suite: "{indent}{n}", //➜✺✽❖❣❢•※⁕∅
		ok: "{indent}  {green}✔{reset} {i}. {n} [{passed}/{total}]",
		nok: "{indent}  {red}✘{reset} {i}. {n} [{passed}/{total}]",
		skip: "{indent}  {yellow}∅{reset} {i}. {n}",
		sum: "1..{total}\n#{passGreen} pass  {pass}/{total} [{passAsserts}/{totalAsserts}]{timeStr}",
		failSum: "#{red}{bold} FAIL  tests {failNums}",
		skipSum: "#{yellow}{bold} skip  {s}",
		bold: "\x1b[1m",
		red: "\x1b[31m",
		green: "\x1b[32m",
		yellow: "\x1b[33m",
		reset: "\x1b[0m",
		color: (_process.stdout || /* c8 ignore next */ _process).isTTY,
		cut: 1500,
		delay: 1,
		seed: (Math.random() * 1e5)|0,
		stack: 9,
		status: 1,
		time: 1,
		timeout: 999,
		total: 0
	})
	, toStr = conf.toString
	, hasOwn = call(conf.hasOwnProperty)
	/*** mockTime ***/
	, fakeNow
	, timers = []
	, timerId = 0
	, fakeTimers = {
		setTimeout: curry(fakeTimeout, false),
		setInterval: curry(fakeTimeout, true),
		clearTimeout: fakeClear,
		clearInterval: fakeClear,
		setImmediate: fakeNextTick,
		clearImmediate: fakeClear,
		Date: fakeDate
	}
	function fakeDate(year, month, date, hr, min, sec, ms) {
		return (
			arguments.length > 1 ?
			new _Date(num(year), num(month), num(date, 1), num(hr), num(min), num(sec), num(ms)) :
			new _Date(num(year, fakeNow))
		)
	}
	fakeDate.now = function() {
		return fakeNow
	}
	fakeDate.parse = _Date.parse
	fakeDate.UTC = _Date.UTC
	function fakeHrtime(time) {
		var diff = _isArray(time) ? fakeNow - (time[0] * 1e3 + time[1] / 1e6) : fakeNow
		return [Math.floor(diff / 1000), Math.round((diff % 1e3) * 1e3) * 1e3] // [seconds, nanoseconds]
	}
	function fakeTimeout(repeat, fn, ms) {
		if (Date === _Date) {
			return _setTimeout.apply(this, slice(arguments, 1))
		}
		if (!isObj(repeat)) {
			repeat = {
				id: ++timerId,
				repeat: repeat,
				fn: fn,
				args: slice(arguments, 3),
				at: fakeNow + ms,
				ms: ms
			}
		}
		for (var i = timers.length; i-- && !(timers[i].at <= repeat.at);); // jshint ignore:line
		timers.splice(i + 1, 0, repeat)
		return timerType == "number" ? /* c8 ignore next */ repeat.id : {
			id: repeat.id,
			unref: This
		}
	}
	function fakeNextTick(fn) {
		fakeTimeout({
			id: ++timerId,
			fn: fn,
			args: slice(arguments, 1),
			at: fakeNow - 1
		})
	}
	function fakeClear(id) {
		if (id) for (var i = timers.length; i--; ) {
			if (timers[i].id === id || timers[i].id === id.id) {
				timers.splice(i, 1)
				break
			}
		}
	}
	/* mockTime end */

	describe.describe = describe
	describe.test = curry(def, 2)
	describe.it = curry(def, 3)
	describe.should = curry(def, 4)
	describe.failed = 0
	describe.output = ""

	describe.diff = diff
	describe.format = format
	describe.opts = opts
	describe.print = print
	describe.stringify = stringify

	each(conf.global, function(_i, value) {
		_global[value] = describe[value]
	})

	function def(t, name, data, fn) {
		if (t < 1) t = isFn(data) + 1
		if (!started) {
			started = new _Date()

			if (!conf.color) {
				conf.bold = conf.red = conf.green = conf.yellow = conf.reset = ""
			}

			if (conf.tap) {
				conf.head = "TAP version 13"
				conf.suite = "# {n}"
				conf.ok = conf.skip = "ok {i} - {n} [{passed}/{total}]"
				conf.nok = "not " + conf.ok
				conf.indent = ""
			} else if (conf.brief) {
				conf.suite = conf.ok = conf.indent = ""
				conf.skip = "{yellow}skip {i} - {n}"
				conf.sum = conf.sum.slice(11)
			}

			if (t !== 1) def(1, "Tests")
			line("head")
			timerType = type(_setTimeout(nextCase, conf.delay|0))
		}
		if (!isStr(name)) {
			fn = data
			data = name
			name = "Unnamed Test" + (t > 1 ? "Case" : "Suite")
		}
		if (!isFn(fn)) {
			fn = data
		}
		var spliceData = [++splicePos, 0, {
			p: inSuite,
			indent: inSuite ? inSuite.indent + (t > 1 ? "" : conf.indent) : "",
			s: t > 1 && !isFn(fn) ? "pending" : data === false ? "by data" : 0,
			t: t,
			n: name,
			f: fn
		}]
		if (data !== fn) {
			each(data, curry(function(item, i, row) {
				conf.i = i
				i = spliceData[i - 0 + 2] = Object.create(item)
				i.f = curry(i.f, i.r = _isArray(row) ? row : (row = [row]))
				i.n = format(i.n, row, conf)
				if (item.f.length > i.r.length + 2 || i.r.length !== spliceData[2].r.length) throw "Invalid data for: " + i.n
			}, spliceData[2]))
			splicePos += data.length - 1
		}
		tests.splice.apply(tests, spliceData)
		return describe
	}

	function nextCase() {
		var tick
		, args = tests[splicePos = runPos++]
		if (!args) printResult()
		else if (args.t === 1) nextSuite(args)
		else {
			testCase.i = ++totalCases
			if (args.p && args.p !== testSuite) testSuite = args.p
			testCase.indent = testSuite.indent
			testCase.n = (args.t < 3 ? "" : "it " + (args.t < 4 ? "" : "should ")) + args.n
			testCase.errors = []
			testCase.total = testCase.passed = 0
			if (args.s || testSuite.s || argv.length && argv.indexOf("" + totalCases) < 0) {
				skipped++
				if (!argv.length) line("skip", testCase)
				return nextCase()
			}
			Object.assign(testCase, assert)
			testCase.end = end
			testCase.ok = testCase
			testCase.plan = function(planned) {
				testCase.planned = planned
				if (planned <= testCase.total) end()
				return testCase
			}
			testCase.setTimeout = function(ms) {
				_clearTimeout(tick)
				tick = _setTimeout(end, ms, "TIMEOUT: " + ms + "ms")
				return testCase
			}

			try {
				testCase.setTimeout(conf.timeout)
				args = args.f.call(testCase, testCase, (testCase.mock = args.f.length > 1 && new Mock()))
				if (args && args.then) args.then(curry(end, null), end)
			} catch (e) {
				print("" + e)
				end(e)
			}
		}
		function testCase(value, message, actual, expected) {
			testCase.total++
			if (testCase.ended) {
				fail("assertion after end")
			}
			if (value) {
				testCase.passed++
			} else {
				fail("Assertion:" + testCase.total + ": " + (message ?
					message + "\nexpected: " + stringify(expected) + "\nactual:   " + stringify(actual) :
					stringify(value) + " is truthy"
				))
			}
			return testCase.plan(testCase.planned)
		}
		function fail(_err) {
			var row, start, i = 0
			, err = type(_err) != "error" ? _Error(_err) : _err
			, stack = err.stack
			if (stack) {
				// iotjs returns stack as Array
				for (stack = _isArray(stack) ? stack : (stack + "").replace(err, "").split("\n"); (row = stack[++i]); ) {
					if (row.indexOf(conf.file) < 0) {
						if (!start) start = i
					}
					if (i - start >= conf.stack) break
				}
				err = [ err ].concat(stack.slice(start, i)).join("\n")
			}

			if (push(testCase.errors, err) == 1) {
				push(failedCases, testCase)
			}
			if (describe.result) printResult()
			return testCase
		}
		function end(err) {
			_clearTimeout(tick)
			if (err) fail(err)
			if (testCase.ended) return fail("ended multiple times")
			testCase.ended = _Date.now()

			if (testCase.planned != void 0 && testCase.planned !== testCase.total) {
				fail("planned " + testCase.planned + " actual " + testCase.total)
			}
			if (testCase.mock) {
				testCase.n += testCase.mock.txt
				testCase.mock.restore()
			}

			totalAsserts += testCase.total
			passedAsserts += testCase.passed

			line(testCase.errors.length ? "nok" : "ok", testCase)
			if (runPos % 1000) nextCase()
			else _setTimeout(nextCase, 1)
		}
	}
	function nextSuite(newSuite) {
		if (!argv.length) line("suite", newSuite)
		newSuite.p = inSuite
		inSuite = testSuite = newSuite
		if (isFn(testSuite.f)) {
			testSuite.f.call(describe)
		} else if (isObj(testSuite.f)) {
			each(testSuite.f, curry(def, 0))
		}
		inSuite = newSuite.p
		nextCase()
	}
	function printResult() {
		testSuite = null
		conf.total = totalCases
		var testCase
		, nums = []
		, failed = failedCases.length
		conf.fail = describe.failed += failed
		conf.pass = totalCases - conf.fail
		conf.s = skipped
		conf.passAsserts = passedAsserts
		conf.totalAsserts = totalAsserts
		conf.passGreen = conf.fail ? "" : conf.green + conf.bold
		conf.failRed = conf.fail ? conf.red : ""
		conf.timeStr = conf.time ? " in " + (_Date.now() - started) + " ms at " + started.toTimeString().slice(0, 8) : ""
		if (conf.status) _process.exitCode = conf.fail
		if (failed) {
			for (; (testCase = failedCases[--failed]); ) {
				nums[failed] = testCase.i
				print("---")
				line("nok", testCase)
				print(testCase.errors.join("\n"))
			}
			conf.failNums = nums.join(", ")
			print("...")
			line("failSum", conf)
			failedCases.length = 0
		}
		describe.result = line("sum", conf)
		if (skipped) {
			line("skipSum", conf)
		}
		if (describe.onend) describe.onend()
	}

	function This() {
		return this
	}
	function diff(a, b, sep) {
		sep = sep || ""
		a = a.split(sep)
		b = b.split(sep)
		var del, ins, pre
		, aLen = a.length
		, bLen = b.length
		, aPos = 0
		, bPos = 0
		, out = []
		for (; aPos < aLen || bPos < bLen; aPos++, bPos++) {
			if (a[aPos] !== b[bPos]) {
				for (pre = bPos; b[pre] !== a[aPos] && pre < bLen; pre++);
				pre -= bPos;

				for (del = 0, ins = 0; a[aPos] !== b[bPos] && (aPos < aLen || bPos < bLen); ) {
					if (aPos < aLen) { del++; aPos++; }
					if (bPos < bLen && a[aPos] !== b[bPos]) { ins++; bPos++; }
				}

				if (ins > 0 || del > 0) {
					if (pre > 0 && pre < ins + del) {
						aPos -= del
						bPos -= ins - pre
						del = 0
						ins = pre
					}
					out.push([aPos - del, del, b.slice(bPos - ins, bPos).join(sep)]);
				}
			}
		}
		return out
	}
	function format(str, map, fallback) {
		return str.replace(lineRe, function(_, field) {
			return map[field] != null ? map[field] : fallback[field]
		})
	}
	function line(name, map) {
		return print(format(conf[name], map, conf))
	}
	function opts(argv, defaults) {
		for (var arg, conf = Object.assign({}, defaults), i = argv.length; i; ) {
			arg = argv[--i].split(/=|--(no-)?/)
			if (arg[0] === "") {
				conf[arg[2]] = arg[4] || !arg[1]
				argv.splice(i, 1)
			}
		}
		return conf
	}
	function print(str) {
		if (!str) return
		if (testSuite && testSuite.indent) {
			str = str.split("\n").join("\n" + testSuite.indent)
		}
		describe.output += str + "\n"
		if (describe.onprint) describe.onprint(str)
		if (_global.console && console.log) console.log(str + conf.reset)
		return str
	}

	//  A spy is a wrapper function to verify an invocation
	//  A stub is a spy with replaced behavior
	function Mock() {
		this.txt = ""
		this._r = []
	}
	Mock.prototype = describe.mock = {
		fn: function(origin) {
			spy.called = 0
			spy.calls = []
			spy.errors = 0
			spy.results = []
			return spy
			function spy() {
				var err, key, result
				, args = slice(arguments)
				if (isFn(origin)) {
					try {
						result = origin.apply(this, arguments)
					} catch(e) {
						spy.errors++
						err = e
					}
				} else if (_isArray(origin)) {
					result = origin[spy.called % origin.length]
				} else if (isObj(origin)) {
					key = JSON.stringify(args).slice(1, -1)
					result = hasOwn(origin, key) ? origin[key] : origin["*"]
				} else result = origin
				spy.called++
				push(spy.results, result)
				push(spy.calls, {
					scope: this,
					args: args,
					error: err,
					result: result
				})
				return result
			}
		},
		rand: function(seed_) {
			var seed = seed_ || conf.seed
			this.txt += " #seed:" + seed
			this.swap(Math, "random", xorshift128(seed))
		},
		spy: function(obj, name, stub) {
			this.swap(obj, name, this.fn(stub || obj[name]))
		},
		swap: function swap(obj, name, fn) {
			if (isObj(name)) {
				each(name, curry(swap, obj, this))
				return
			}
			var existing = obj[name]
			push(this._r, obj, name, hasOwn(obj, name) && existing)
			obj[name] = fn
			if (fn === fn && obj[name] !== fn) throw _Error("Unable to swap " + stringify(name))
			return existing
		},
		restore: function() {
			for (var arr = this._r, i = arr.length; --i > 0; i -= 2) {
				if (arr[i]) {
					arr[i - 2][arr[i - 1]] = arr[i]
				} else {
					delete arr[i - 2][arr[i - 1]]
				}
			}
		/*** mockTime ***/
			this.tick(_Infinity, true)
		},
		time: function(newTime, newZone) {
			var mock = this
			if (!mock._time) {
				mock._time = fakeNow = _Date.now()
				mock.swap(_global, fakeTimers)
				mock.swap(_process, { nextTick: fakeNextTick, hrtime: fakeHrtime })
			}
			if (newTime) {
				fakeNow = isStr(newTime) ? _Date.parse(newTime) : newTime
				mock.tick(0)
			}
			fakeDate._z = newZone
		},
		tick: function(amount, noRepeat) {
			var t
			, nextNow = type(amount) === "number" ? fakeNow + amount : timers[0] ? timers[0].at : fakeNow

			for (; (t = timers[0]) && t.at <= nextNow; ) {
				fakeNow = t.at
				timers.shift()
				if (isStr(t.fn)) t.fn = Function(t.fn)
				if (isFn(t.fn)) t.fn.apply(null, t.args)
				if (!noRepeat && t.repeat) {
					t.at += t.ms
					fakeTimeout(t)
				}
			}
			fakeNow = nextNow
		/* mockTime end */
		}
	}

	function xorshift128(a) {
		var b = a * 2e3, c = a * 3e4, d = a * 4e5
		return function() {
			var t = d ^ (d << 11)
			d = c; c = b; b = a
			a ^= t ^ (t >>> 8) ^ (a >>> 19)
			return (a >>> 0) / 4294967295
		}
	}

	function _deepEqual(actual, expected, circ) {
		if (
			actual === expected ||
			// make NaN equal to NaN
			actual !== actual && expected !== expected
		) return true

		var key, aKeys, len
		, aType = typeof actual

		if (
			aType !== "object" ||
			actual == null || // jshint ignore:line
			aType !== typeof expected ||
			(aType = type(actual)) != type(expected) ||
			(actual.constructor && actual.constructor !== expected.constructor) ||
			(aType == "date" && actual.getTime() !== expected.getTime()) ||
			(aType == "regexp" && "" + actual !== "" + expected)
		) {
			return false
		}

		key = circ.indexOf(actual)
		if (key > -1) return true
		push(circ, actual)

		if (aType == "array" || aType == "arguments") {
			len = actual.length
			if (len !== expected.length) return false
			for (; len--; ) {
				if (!_deepEqual(actual[len], expected[len], circ)) return false
			}
		} else {
			aKeys = _keys(actual)
			len = aKeys.length
			if (len !== _keys(expected).length) return false
			for (; len--; ) {
				key = aKeys[len]
				if (
					!hasOwn(expected, key) ||
					!_deepEqual(actual[key], expected[key], circ)
				) return false
			}
		}
		return true
	}

	function type(obj) {
		/* jshint -W041 */
		// Standard clearly states that NaN and Infinity are numbers
		// but this is not useful for testing.
		return (
			obj !== obj ? "nan" :
			obj === _Infinity || obj === -_Infinity ? "infinity" :
			obj == null ? "" + obj :
			toStr.call(obj).slice(8, -1).toLowerCase()
		)
	}
	function num(a, b) {
		return type(a -= 0) === "number" ? a : b
	}
	function isStr(str) {
		return typeof str === "string"
	}
	function isFn(fn) {
		return typeof fn === "function"
	}
	function isObj(obj) {
		return type(obj) === "object"
	}
	function own(a, b) {
		if (a === b) {
			own.lastMsg = "Can not be strictEqual"
		} else if (a) {
			for (var k in b) if (hasOwn(b, k)) {
				if (!hasOwn(a, k) || (
					isObj(b[k]) ? !own(a[k], b[k]) :
					a[k] !== b[k]
				)) {
					own.lastMsg = own.lastMsg || k + " " + stringify(a[k]) + " != " + stringify(b[k])
					return false
				}
			}
			return true
		}
	}
	function curry(fn, arg, scope) {
		return fn.bind.apply(fn, [scope].concat(arg))
	}

	function each(arr, fn) {
		if (arr) {
			if (isStr(arr)) arr = arr.split(",")
			for (var i in arr) if (hasOwn(arr, i)) fn(i, arr[i])
		}
	}

	function stringify(item) {
		var max = conf.cut > 0 ? conf.cut : _Infinity
		, str = _stringify(item, max, [])
		return str.length > max ? str.slice(0, max - 3) + ".." + str.slice(-1) : str
	}

	function _stringify(item, max, circ) {
		var i, t, tmp
		, left = max
		, str =
			isStr(item) ? JSON.stringify(item) :
			isFn(item) ? ("" + item).replace(/^\w+|\s+|{[\s\S]*/g, "") :
			!item || item === true || typeof item === "number" ? "" + item :
			(t = type(item)) === "error" || t === "symbol" || t === "regexp" ? item.toString() :
			item.toJSON ? item.toJSON() :
			item

		if (!isStr(str)) {
			if (circ.indexOf(str) > -1) return "Circular"
			push(circ, str)
			tmp = []
			for (i in str) if (hasOwn(str, i)) {
				i = (t === "object" ? _stringify(i, left) + ":" : "") + _stringify(str[i], left, circ)
				push(tmp, i)
				left -= i.length
				if (left < 0) break
			}
			str =
			t === "array" ? "[" + tmp + "]" :
			t === "arguments" ? t + "[" + tmp + "]" :
			(t = item.constructor) === Object ? "{" + tmp + "}" :
			(t ? t.name || /^\w+\s+([^\s(]+)|/.exec(t)[1] || "<anon>" : "<null>") + "{" + tmp + "}"
		}
		return str
	}
}(this, setTimeout, clearTimeout, Date, Error, Infinity) // jshint ignore:line

