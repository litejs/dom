
/*! litejs.com/MIT-LICENSE.txt */

/* global document, location */

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


!function(window) {
	var rewrite = {
		//!{loadRewrite}
	}
	/*** log ***/
	, initTime = xhr._t = +new Date()
	/**/
	// Expose xhr._c for testing.
	, loaded = /*** debug ***/ xhr._c = /**/ {}

	/*** ie9 ***/
	, Fn = Function
	, nop = Fn()
	, execScript =
		// IE5-10, Chrome1-12
		window.execScript ||
		// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
		// In case of local execution `e('eval')` returns undefined
		Fn("e,eval", "try{return e('eval')}catch(e){}")(eval) ||
		Fn("a", "var d=document,b=d.body,s=d.createElement('script');s.text=a;b.appendChild(s)")

	// Move setTimeout from window.prototype to window object for future patching in IE9.
	, setTimeout_ = window.setTimeout = setTimeout

	// XHR memory leak mitigation
	, xhrs = []

	// XMLHttpRequest in IE7-8 do not accept PATCH, use ActiveX.
	// IE disallows adding custom properties to ActiveX objects and read/write readystatechange after send().
	, XMLHttpRequest = +"\v1" && window.XMLHttpRequest || Fn("return new ActiveXObject('Microsoft.XMLHTTP')")
	/*/
	, execScript = eval
	, setTimeout_ = setTimeout
	/**/

	/*** log ***/
	, unsentLog = xhr._l = []
	, lastError
	// load.js is expected to be the first script to run and no prior window.onerror exists.
	, onerror = window.onerror = function(message, file, line, col, error) {
		// Do not send multiple copies of the same error.
		// file = document.currentScript.src || import.meta.url
		if (lastError !== (lastError =
			[ file
			, line
			, col || (window.event || unsentLog).errorCharacter || "?"
			, message
			].join(":")
		)) log("e", lastError, [error && (error.stack || error.stacktrace) || "-", "" + location])
	}
	, log = xhr.log = function(type, msg, extra) {
		if (unsentLog.push([new Date() - initTime, type].concat(msg, extra || [])) < 2) sendLog()
		function sendLog() {
			setTimeout_(xhr.sendLog || sendLog, 1307)
		}
	}
	/**/


	/*** theme ***/
	, savedTheme
	, ALT_THEME = "dark"
	try {
		savedTheme = window.localStorage.theme
	} catch(e){}
	if (ALT_THEME == (
		savedTheme ||
		(savedTheme = window.matchMedia) && savedTheme("(prefers-color-scheme:dark)").matches && ALT_THEME
	)) {
		document.documentElement.className = "is-" + ALT_THEME
	}
	/**/

	window.xhr = xhr
	// next === true is for sync call
	function xhr(method, url, next, attr1, attr2) {
		var req = /*** ie9 ***/ xhrs.pop() || /**/ new XMLHttpRequest()

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
				/*** ie9 ***/
				// ActiveXObject does not accept `null` for onreadystatechange
				req.onreadystatechange = next = nop
				xhrs.push(req)
				/*/
				req.onreadystatechange = next = null
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
			res[filePos] = err ? (/*** log ***/ onerror(err, fileName),/**/ "") : str
			exec()
		}
		function exec() {
			if (res[pos]) {
				if (raw) {
					files[pos] = 0
				} else {
					try {
						var execResult = (xhr[files[pos].replace(/[^?]+\.|\?.*/g, "")] || execScript)(res[pos], files[pos])
						if (execResult && execResult.then) {
							res[pos] = 0
							return execResult.then(advanceExec, advanceExec)
						}
					} catch(e) {
						/*** log ***/
						onerror(e, files[pos])
						/**/
					}
					res[pos] = ""
				}
			}
			if (res[pos] === "" || !files[pos]) {
				if (++pos < len) exec()
				/*** ie9 ***/
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
		function advanceExec(err) {
			if (err) onerror(err, files[pos])
			res[pos] = ""
			exec()
		}
	}

	load([
		//!{loadFiles}
	])
	/**/

}(this) // jshint ignore:line

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
!function(window, Date, Function, Infinity, P) {

	// Array#flat()         - Chrome69, Firefox62, Safari12
	// window.PointerEvent  - Chrome55, Firefox59, Safari13,   IE11
	// navigator.sendBeacon - Chrome39, Firefox31, Safari11.1
	// Object.fromEntries   - Chrome73, Firefox63, Safari12.1, Opera60, Node.js12.0.0
	// queueMicrotask       - Chrome71, Firefox69, Safari12.1
	// "".at(), [].at()     - Chrome92, Firefox90, Safari15.4

	var UNDEF, canCapture, isArray, oKeys
	, O = window
	, NULL = null
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
	, navigator = patch("navigator", {})
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
	/* node:coverage ignore next 19 */
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
		pagehide: "onpagehide" in window ? UNDEF : "beforeunload",
		wheel: wheelEv
	}
	, fixFn = Event.fixFn = {
		/* node:coverage ignore next 17 */
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
	a = "AnimationFrame"
	patch("request" + a, "return setTimeout(a,50)")
	// window.mozRequestAnimationFrame    || // Firefox 4-23
	// window.webkitRequestAnimationFrame || // Chrome 10-24
	// window.msRequestAnimationFrame     || // IE 10 PP2+
	patch("cancel" + a, "clearTimeout(a)")


	/* node:coverage ignore next 8 */
	if (!IS_NODE && !(onhashchange in window) || ie67) {
		patch(onhashchange, NULL)
		setInterval(function() {
			if (lastHash !== (lastHash = location.href.split("#")[1]) && isFn(window[onhashchange])) {
				window[onhashchange]()
			}
		}, 60)
	}

	// Missing PointerEvents with Scribble enable on Safari 14
	// https://mikepk.com/2020/10/iOS-safari-scribble-bug/
	// https://bugs.webkit.org/show_bug.cgi?id=217430
	/* node:coverage ignore next 50 */
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
				/* node:coverage ignore next 19 */
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
				return data[id] || NULL
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
	createStorage("local")      // Chrome5, FF3.5, IE8, Safari4, IE8

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
				o !== o || o == NULL || o === Infinity || o === -Infinity ? "null" :
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

	// Since Chrome23/Firefox21 parseInt parses leading-zero strings as decimal, not octal
	b = patch("g:parseInt", "return X(a,(b>>>0)||(Y.test(''+a)?16:10))", _parseInt("08") !== 8, _parseInt, /^\s*[-+]?0[xX]/)

	O = Math
	patch("log10", "return X(a)/Y", 0, O.log, O.LN10)

	a = O.pow
	O = Number
	patch("parseInt", b)
	patch("parseFloat", parseFloat)
	patch("isNaN", "return a!==a")
	c = "_SAFE_INTEGER"
	patch("EPSILON", a(2, -52))
	patch(
		"isSafeInteger", "return Y(a)&&a>=X&&a<=-X", 0,
		patch("MIN" + c, -patch("MAX" + c, a(2, 53)-1)),
		patch("isInteger", "return X(a)&&a%1===0", 0, patch("isFinite", "return typeof a==='number'&&isFinite(a)"))
	)

	O = Date
	patch("now", "return+new Date")

	/*** toISOString ***/
	O = O[P]
	// IE8 toJSON does not return milliseconds
	// FF37 returns invalid extended ISO-8601, `29349-01-26T00:00:00.000Z` instead of `+029349-01-26T00:00:00.000Z`
	/* node:coverage ignore next */
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
	patch("from", "a=X(a)?a.split(''):S.call(a);return b?a.map(b,c):a", 0, isStr)
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
	patch("find",        b + "return t[i]")
	patch("some",        b + "return!0;return!1")

	patch("flat",        "return a<1?S.call(t):(b=t.concat.apply([],t))&&a>1&&b.some(X)?b.flat(a-1):b", 0, isArray)
	patch("flatMap",     "return X.apply(t,A).flat()", 0, O.map)
	//patch("entries", "a=this;b=-1;return{next:function(){c=a.length<=++b;return{done:c,value:c?void 0:a[b]}}}")

	a = "b=t.length;a=a<0?b+a|0:a|0;return a>=b||a<0?X:t"
	patch("at",          a + "[a]")

	O = String[P]
	patch("s:at",        a + ".charAt(a)")
	patch("endsWith", "return(a+='')===t.slice(-a.length)")
	patch("startsWith", "return t.lastIndexOf(a,0)===0")
	patch("trim", "return t.replace(/^\\s+|\\s+$/g,'')")


	O = navigator
	patch("sendBeacon", function(url, data) {
		// The synchronous XMLHttpRequest blocks the process of unloading the document,
		// which in turn causes the next navigation appear to be slower.
		try {
			url = xhr("POST", url, xhr.unload)
			url.setRequestHeader("Content-Type", "text/plain;charset=UTF-8")
			url.send(data)
			return true
		} catch(e){}
		return false
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

	/* node:coverage ignore next 13 */
	try {
		O[a = "addEventListener"]("t", NULL, Object.defineProperties({}, {
			capture: { get: function() { canCapture = 1 } }
		}))
		b = "removeEventListener"
		c = "O.call(t,a,b,X(c)?!!c.capture:!!c)"
		if (!canCapture) {
			patch("c:" + a, c, 1, isObj)
			patch("c:" + b, c, 1, isObj)
		}
	} catch(e){}
	// The addEventListener is supported in Internet Explorer from version 9.
	// https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
	// - IE8 always prevents the default of the mousewheel event.
	patch(a, "return(t.attachEvent('on'+a,b=X(t,a,b)),b)", 0, function(el, ev, fn) {
		/* node:coverage ignore next 8 */
		return function() {
			var e = new Event(ev)
			if (e.clientX !== UNDEF) {
				e.pageX = e.clientX + (window.pageXOffset || html.scrollLeft || body.scrollLeft || 0)
				e.pageY = e.clientY + (window.pageYOffset || html.scrollTop || body.scrollTop || 0)
			}
			fn.call(el, e)
		}
	})
	patch(b, "t.detachEvent('on'+a,b)")


	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	patch((a = "querySelector"), (b = "return X(t,a,Y)"), ie678, find, 1)
	patch(a + "All", b, ie678, find, 0)


	function selectorFn(str) {
		if (!str || !isStr(str)) throw Error("Invalid selector")
		return selectorCache[str] ||
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
		return first ? NULL : out
	}

	function find(node, sel, first) {
		return walk("firstChild", first, node.firstChild, sel, function(el) {
			for (var next = el.nextSibling; !next && ((el = el.parentNode) !== node); ) next = el.nextSibling
			return next
		})
	}


	// ie6789
	// The documentMode is an IE only property, supported from IE8.
	/* node:coverage ignore next 8 */
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
	/* node:coverage ignore next 3 */
	function isObj(obj) {
		return !!obj && obj.constructor === Object
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
			src
		))
	}
}(this, Date, Function, Infinity, "prototype") // jshint ignore:line


!function(window) {
	var modules = {}
	, process = window.process = {
		env: {}
	}

	//process.memoryUsage = function() {
	//	return (window.performance || {}).memory || {}
	//}

	window.require = require
	function require(name) {
		var mod = modules[name]
		if (!mod) throw Error("Module not found: " + name)
		if (typeof mod == "string") {
			var exports = modules[name] = {}
			, module = { id: name, filename: name, exports: exports }
			Function("exports,require,module,process,global", mod).call(
				exports, exports, require, module, process, window
			)
			mod = modules[name] = module.exports
		}
		return mod
	}

	require.def = function(map, key) {
		for (key in map) modules[key] = map[key]
	}
}(this) // jshint ignore:line



/* litejs.com/MIT-LICENSE.txt */

/* global escape, navigator, xhr */

// Conditional compilation via toggle comments (processed by build tool):
//   /*** name ***/  code   /**/              - `code` active in source; build can strip it
//   /*** name ***/  code1  /*/  code2  /**/  - `code1` active in source, `code2` commented out; build can swap

/*** debug ***/
console.log("LiteJS is in debug mode, but it's fine for production")
/**/

!function(window, document, history, localStorage, location, navigator, Function, Object) {
	window.El = El
	asEmitter(window.LiteJS = LiteJS)

	var UNDEF, parser, pushBase, styleNode
	, NUL = null
	// THIS will be `undefined` in strict mode and `window` in sloppy mode
	, THIS = this
	, html = document.documentElement
	, body = document.body
	, splitRe = /[,\s]+/
	, emptyArr = []
	, plugins = {}
	, sources = []
	, assign = Object.assign
	// bind(fn, ctx, ...args)() calls fn.call(ctx, ...args); closureless partial application
	, bind = El.bind.bind(El.call)
	, create = Object.create
	, hasOwn = bind(plugins.hasOwnProperty)
	, isArr = Array.isArray
	, slice = emptyArr.slice
	// Closureless utilities via Function() to avoid capturing outer scope
	, elReplace = Function("a,b,c", "a&&b&&(c=a.parentNode)&&c.replaceChild(b,a)")
	, elRm = Function("a,b", "a&&(b=a.parentNode)&&b.removeChild(a)")
	, getAttr = Function("a,b", "return a&&a.getAttribute&&a.getAttribute(b)")
	, replace = Function("a,b,c", "return c.replace(a,b)")
	, toCamel = replace.bind(NUL, /\-([a-z])/g, Function("a,b", "return b.toUpperCase()"))

	/*** ie9 ***/
	// JScript engine in IE8 and below does not recognize vertical tabulation character `\v`.
	// http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	, ie678 = !+"\v1" // jshint ignore:line
	// innerText is implemented in IE4, textContent in IE9, Node.text in Opera 9-10
	// Safari 2.x innerText results an empty string when style.display=="none" or Node is not in DOM
	, txtAttr = El.T = "textContent" in html ? "textContent" : "innerText"
	, elTxt = function(el, txt) {
		if (el[txtAttr] !== txt) el[txtAttr] = txt
	}
	/*/
	, elTxt = function(el, txt) {
		if (el.textContent !== txt) el.textContent = txt
	}
	/**/

	, elSeq = 0
	, elCache = {}
	// Parses ";name! args" binding expressions from _b attribute
	, renderRe = /[;\s]*([-.\w$]+)(?:(!?)[ :]*((?:(["'\/])(?:\\.|[^\\])*?\4|[^;])*))?/g
	// Parses CSS selectors: .class #id [attr=val] :pseudo
	, selectorRe = /([.#:[])([-\w]+)(?:([~^$*|]?)=(("|')(?:\\.|[^\\])*?\5|[-\w]+))?]?/g
	, fnCache = {}
	// Matches tokens to exclude from scope variable extraction: strings, keywords, member access, labels
	, fnRe = /('|")(?:\\.|[^\\])*?\1|\/(?:\\.|[^\\])+?\/[gim]*|\$el\b|\$[aorsS]\b|\b(?:false|in|if|new|null|this|true|typeof|void|function|var|else|return)\b|\.\w+|\w+:/g
	, wordRe = /[a-z_$][\w$]*/ig
	, bindingsCss = acceptMany(function(el, key, val, current) {
		current = el.style[key = toCamel(key)]
		el.style[key] = val
		return current
	})
	, bindingsOn = acceptMany(addEvent, 1)
	, bindings = {
		cls: acceptMany(cls),
		css: bindingsCss,
		on: bindingsOn,
		one: acceptMany(function(el, ev, fn) {
			addEvent(el, ev, function remove() {
				rmEvent(el, ev, remove)
				fn.apply(el, arguments)
			})
		}, 1),
		set: acceptMany(setAttr),
		txt: elTxt,
		/*** form ***/
		val: function elVal(el, val, ignoreFocus) {
			if (!el) return
			var input, step, key, value
			, i = 0
			, type = el.type
			, opts = el.options
			, checkbox = type === "checkbox" || type === "radio"

			if (el.tagName === "FORM") {
				// Disabled controls do not receive focus,
				// are skipped in tabbing navigation, cannot be successfully posted.
				//
				// Read-only elements receive focus but cannot be modified by the user,
				// are included in tabbing navigation, are successfully posted.
				//
				// Read-only checkboxes can be changed by the user

				for (opts = {}; (input = el.elements[i++]); ) if (!input.disabled && (key = input.name || input.id)) {
					value = elVal(input, val != UNDEF ? val[key] : UNDEF, ignoreFocus)
					if (value !== UNDEF) {
						step = opts
						replace(/\[(.*?)\]/g, replacer, key)
						step[key || step.length] = value
					}
				}
				return opts
			}

			if (val !== UNDEF) {
				try {
					if (!ignoreFocus && document.activeElement === el) return
				} catch (e) {}
				if (opts) {
					for (value = (isArr(val) ? val : [ val ]).map(String); (input = opts[i++]); ) {
						input.selected = value.indexOf(input.value) > -1
					}
				} else if (el.val) {
					el.val(val)
				} else if (checkbox) {
					el.checked = !!val
				} else {
					el.value = val
				}
				return
			}

			if (opts) {
				if (type === "select-multiple") {
					for (val = []; (input = opts[i++]); ) {
						if (input.selected && !input.disabled) {
							val.push(input.valObject || input.value)
						}
					}
					return val
				}
				// IE8 throws error when accessing to options[-1]
				value = el.selectedIndex
				el = value > -1 && opts[value] || el
			}

			return checkbox && !el.checked ?
			(type === "radio" ? UNDEF : NUL) :
			el.valObject !== UNDEF ? el.valObject : el.value

			function replacer(_, _key, offset) {
				if (step == opts) key = key.slice(0, offset)
				step = step[key] || (step[key] = step[key] === NUL || _key && +_key != _key ? {} : [])
				key = _key
			}
		}
		/**/
	}
	// Stores "!" once-bindings; index used in compiled fn to strip from _b after first run
	, bindOnce = []
	, globalScope = {
		El: El,
		$b: bindings
	}
	// Array-like wrapper methods for multi-element collections (mixed into arrays by ElWrap)
	, elArr = {
		append: function(el) {
			var elWrap = this
			if (elWrap._s) {
				append(elWrap[elWrap._s[getAttr(el, "slot") || elWrap._s._] || 0], el)
			} else {
				elWrap.push(el)
			}
			return elWrap
		},
		cloneNode: function(deep) {
			deep = ElWrap(this, deep)
			deep._s = this._s
			return deep
		}
	}

	// fixEv: maps custom event names to native (e.g., touch→"" for non-DOM events)
	// fixFn: transforms event handlers for browser compat (e.g., touch→pointer init)
	, Event = window.Event || window
	, fixEv = Event.fixEv || (Event.fixEv = {})
	, fixFn = Event.fixFn || (Event.fixFn = {})

	/*** markup ***/
	, blockRe = /^(?:(=+|>| -) ([\s\S]+)|\[! *(\S*) *!] ?(.*))/
	, tags = {
		" -": "ul",
		"!": "a",
		"*": "b",
		"+": "ins",
		",": "sub",
		"-": "del",
		"/": "i",
		":": "mark",
		";": "span",
		">": "blockquote",
		"@": "time",
		"^": "sup",
		"_": "u",
		"`": "code",
		"~": "s"
	}
	function inline(tag, op, text, name, link, attr) {
		return op && !isArr(text) ? "<" +
			(tag = tags[op] || "h" + op.length) +
			(tag == "a" ? " href=\"" + (link || text) + "\"" : op == "@" ? " datetime=\"" + name + "\"" : "") +
			(attr ? " class=\"" + attr.slice(1) + "\">" : ">") +
			(
				op === ">" ? doc(replace(/^> ?/gm, "", text)) :
				tag == "ul" ? "<li>" + text.split(/\n - (?=\S)/).map(inline).join("</li>\n<li>") + "</li>" :
				inline(tag == "a" ? replace(/^\w+:\/{0,2}/, "", name) : text)
			) +
			"</" + tag + ">" :
		replace(/\[([-!*+,/:;@^_`~])((.+?)(?: (\S+?))?)\1(\.[.\w]+)?]/g, inline, tag)
	}
	function block(tag, op, text, media, alt) {
		return op && !isArr(text) ? inline(tag, op, text) :
		media ? "<img src=\"" + media + "\" alt=\"" + alt + "\">" :
		blockRe.test(tag) ? replace(blockRe, block, tag) :
		tag === "---" ? "<hr>" : "<p>" + inline(tag) + "</p>"
	}
	function doc(txt) {
		return replace(/^ \b/gm, "<br>", txt.trim()).split(/\n\n+/).map(block).join("\n")
	}
	bindings.t = function(el, text) {
		el.innerHTML = inline(replace(/</g, "&lt;", text))
	}
	bindings.d = function(el, text) {
		el.innerHTML = doc(replace(/</g, "&lt;", text))
	}
	/**/

	/*** svg ***/
	bindings.xlink = function(el, href) {
		// In SVG2, xlink namespace is not needed, plain href can be used (Chrome50 2016, Firefox51 2017).
		el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href)
	}
	if (window.SVGElement) {
		each("animate animateMotion animateTransform circle clipPath defs ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence g image line linearGradient marker mask mpath path pattern polygon polyline radialGradient rect set stop svg text textPath tspan use", function(name) {
			elCache[name] = document.createElementNS("http://www.w3.org/2000/svg", name)
		})
		// a style title
	}
	/**/

	xhr.css = injectCss
	xhr.ui = function(src) {
		sources.push(src)
	}

	function asEmitter(obj) {
		obj.on = wrap(on)
		obj.off = off
		obj.one = one
		obj.emit = wrap(emit)
		// emitNext, emitLate
		function wrap(fn) {
			return function(a, b, c, d, e) {
				return fn(this, a, b, c, d, e)
			}
		}
		function one(type, fn, scope) {
			var emitter = this
			on(emitter, type, function remove() {
				off.call(emitter, type, remove, scope)
				fn.apply(scope, arguments)
			}, scope)
			return emitter
		}
	}

	// Events stored as triplets [scope, _origin, fn] in emitter._e[type]
	// _origin tracks the unwrapped fn before fixFn (for rmEvent lookup)
	// emptyArr substitutes window as emitter (can't safely add _e property to window)
	function on(emitter, type, fn, scope, _origin) {
		if (emitter && type && fn) {
			if (emitter === window) emitter = emptyArr
			var events = emitter._e || (emitter._e = create(NUL))
			;(events[type] || (events[type] = [])).unshift(scope, _origin, fn)
		}
		return emitter
	}

	function off(type, fn, scope) {
		var i
		, emitter = this === window ? emptyArr : this
		, events = emitter._e && emitter._e[type]
		if (events) {
			for (i = events.length - 2; i > 0; i -= 3) {
				if ((events[i + 1] === fn || events[i] === fn) && events[i - 1] == scope) {
					events.splice(i - 1, 3)
					if (fn) break
				}
			}
		}
		return this
	}

	function emit(emitter, type) {
		if (emitter === window) emitter = emptyArr
		var args, i
		, _e = emitter._e
		, arr = _e ? (_e[type] || emptyArr).concat(_e["*"] || emptyArr) : emptyArr
		if ((_e = arr.length)) {
			for (i = _e - 1, args = slice.call(arguments, 2); i > 1; i -= 3) {
				if (arr[i]) arr[i].apply(arr[i - 2] || emitter, args)
			}
		}
		return _e / 3
	}

	function addEvent(el, ev, fn, opts) {
		var fn2 = fixFn[ev] && fixFn[ev](el, fn, ev) || fn
		, ev2 = fixEv[ev] || ev

		if (ev2 !== "" && "on" + ev2 in el) {
			// polyfilled addEventListener returns patched function
			// useCapture defaults to false
			// Chrome56 touchstart/move sets {passive:true} by default; use {passive:false} to enable preventDefault()
			fn2 = html.addEventListener.call(el, ev2, fn2, opts) || fn2
		}

		on(el, ev, fn2, el, fn)
	}

	function rmEvent(el, ev, fn, opts) {
		var evs = el._e && el._e[ev]
		, id = evs && evs.indexOf(fn)
		, ev2 = fixEv[ev] || ev
		if (id > -1) {
			if (fn !== evs[id + 1] && evs[id + 1]._rm) {
				evs[id + 1]._rm()
			}
			if (ev2 !== "" && "on" + ev2 in el) {
				html.removeEventListener.call(el, ev2, evs[id + 1], opts)
			}
			evs.splice(id - 1, 3)
		}
	}

	function eventStop(e) {
		if (e && e.preventDefault) {
			e.stopPropagation()
			e.preventDefault()
		}
		return false
	}

	function LiteJS(opts) {
		opts = assign({
			/*** breakpoints ***/
			breakpoints: "sm,601=md,1025=lg",
			/**/
			home: "home",
			root: body
		}, opts)

		// View properties:
		//   .r  route pattern    .e  template element    .p  parent view
		//   .c  active child     .o  rendered clone      .f  file dependencies (csv)
		//   .s  route sequence#  .kb keyboard shortcuts
		function View(route, el, parent) {
			var view = views[route]
			if (view) {
				if (el) {
					view.e = el
					view.p = parent && View(parent)
				}
				return view
			}
			view = this
			if (view === THIS) return new View(route, el, parent)
			views[view.r = route] = view
			view.e = isStr(el) ? find(html, el) : el
			view.p = parent && View(parent)

			if (route.charAt(0) !== "#") {
				fnStr += "m[" + (view.s = routeSeq++) + "]?("
				reStr += "|(" + replace(routeRe, function(_, expr) {
					return expr ?
						(fnStr += "p['" + expr + "']=m[" + (routeSeq++) + "],") && "([^/]+?)" :
						replace(reEsc, "\\$&", _)
				}, route) + ")"
				fnStr += "'" + route + "'):"
				viewFn = 0
			}
		}

		asEmitter(View)
		asEmitter(View.prototype = {
			wait: function() {
				var params = lastParams
				params._p = 1 + (params._p | 0) // pending
				return function() {
					if (--params._p || lastParams !== params || syncResume) return
					bubbleUp(params)
				}
			}
		})

		var viewFn, lastView, lastUrl, syncResume
		, fnStr = ""
		, reStr = ""
		, reEsc = /[.*+?^${}()|[\]/\\]/g
		, routeRe = /\{([\w%.]+?)\}|.[^{\\]*?/g
		, routeSeq = 1

		, views = View.views = {}
		, paramCb = {}
		, lastParams = paramCb
		, root = View("#", opts.root).e
		, $d = elScope(root, root)

		$d.$ui = assign(View, {
			$: bind(find, View, root),
			$$: bind(findAll, View, root),
			$d: $d,
			def: viewDef,
			get: viewGet,
			param: function(names, cb) {
				each(names, function(n) {
					paramCb[n] = cb
				})
			},
			parse: (parser = viewParse),
			ping: function(view, fn) {
				on(View(view), "ping", fn)
			},
			show: viewShow
		})

		each(opts, function(val, opt) {
			if (isFn(View[opt])) {
				each(val, function(obj, key) {
					View[opt](key, obj)
				})
			} else {
				View[opt] = val
			}
		})

		// params._p pending async count; ._v current view in traversal; ._c view to close; ._t navigation timestamp
		function bubbleUp(params) {
			var parent
			, view = lastView
			, tmp = params._v || view // Continue bubbleUp from _v
			params._c = view.o ? view : params._c
			for (View.route = view.r; tmp; tmp = parent) {
				viewEmit(syncResume = params._v = tmp, "ping", params, View)
				syncResume = UNDEF
				if (lastParams !== params) return
				if ((parent = tmp.p)) {
					if (parent.c && parent.c !== tmp) {
						params._c = parent.c
					}
					parent.c = tmp
				}
				if (tmp.f) {
					return xhr.load(
						replace(/^|,/g, "$&" + (View.path || ""), tmp.f).split(","),
						bind(readTemplates, view, view.wait(tmp.f = ""))
					)
				} else if (!tmp.e) {
					if (tmp.r === "404") {
						viewParse("%view 404 #\nh2 Not found")
					}
					return viewShow("404")
				}
			}

			for (tmp in params) {
				if (tmp.charAt(0) !== "_" && (syncResume = hasOwn(paramCb, tmp) && paramCb[tmp] || paramCb["*"])) {
					syncResume(params[tmp], tmp, view, params)
					syncResume = UNDEF
				}
			}
			bubbleDown(params)
		}
		function bubbleDown(params) {
			var view = params._v
			, close = params._c
			, parent = view && view.p
			if (!view || params._p && /{/.test(view.r)) {
				return viewClose(close)
			}
			if (parent && !view.o || view === close) {
				viewClose(close, view)
				append(parent.o || parent.e, view.o = view.e.cloneNode(true))
				render(view.o)
				viewEmit(parent, "openChild", view, close)
				viewEmit(view, "open", params)
				/*** kb ***/
				addKb(view.kb)
				/**/
				params._c = UNDEF
			}
			if ((params._v = view.c)) {
				bubbleDown(params)
			}
			if ((lastView === view)) {
				for (; view; view = view.p) {
					viewEmit(view, "pong", params, View)
				}
				viewEmit(lastView, "show", params)
				blur()
			}
			function viewClose(view, open) {
				if (view && view.o) {
					viewEmit(view.p, "closeChild", view, open)
					viewClose(view.c)
					elKill(view.o)
					view.o = UNDEF
					/*** kb ***/
					rmKb(view.kb)
					/**/
					viewEmit(view, "close")
				}
			}
		}

		function viewDef(str) {
			for (var match, re = /(\S+) (\S+)/g; (match = re.exec(str)); ) {
				each(match[1], def)
			}
			function def(view) {
				view = View(expand(view))
				each(match[2], function(file) {
					view.f = (view.f ? view.f + "," : "") + (views[file] ? views[file].f : expand(file))
				})
			}
		}
		function viewEmit(view, event, a, b) {
			emit(view, event, a, b)
			emit(View, event, view, a, b)
			emit(LiteJS, event, view, a, b)
		}
		function viewEval(str, scope) {
			try {
				Function("$s,$ui,$d,$,$$", str)(scope, View, $d, View.$, View.$$)
			} catch(e) {
				throw e + "\nviewEval: " + str
			}
		}
		function viewGet(url, params) {
			if (!viewFn) {
				viewFn = Function(
					"var r=/^\\/?(?:" + reStr + ")[\\/\\s]*$/;" +
					"return function(u,p,d){var m=r.exec(u);return m!==null?(" + fnStr + "d):d}"
				)()
			}
			return View(url ? viewFn(url, params || {}, "404") : View.home)
		}
		function viewParse(str) {
			if (!str) return
			var parent = El("div")
			, stack = [-1]
			, parentStack = []
			, templateRe = /([ \t]*)(%?)((?:("|')(?:\\.|[^\\])*?\4|[-#:.\w[\]](?:[~^$*|]?=)?)*) ?([\/>=@^;]|)(([\])}]?).*?([[({]?))(?=\x1f|$)/gm
			replace(templateRe, work, str)
			work("", "")
			if (parent.childNodes[0]) {
				append(root, parent.childNodes)
				render(root)
				/*** debug ***/
				console.log("Outside view defined elements are rendered immediately into UI")
				/**/
			}
			if (parent.i) {
				histStart(viewShow)
			}

			function work(all, indent, plugin, sel, q, op, text, mapEnd, mapStart, offset) {
				if (offset && all === indent) return

				for (q = indent.length; q <= stack[0]; ) {
					if ((offset = parent.p)) {
						if (offset.c && !offset.e.childNodes[0]) break
						offset.d(offset)
					}
					parent = parentStack.pop()
					stack.shift()
				}
				if (op === "@") {
					text = replace(/([\w,.]+)[!:]?/, /^\w+!/.test(text) ? "one!'$1'," : "on!'$1',", text)
				}
				if (parent.r) {
					parent.t += "\n" + all
				} else if (plugin || mapStart && (sel = "map")) {
					if (plugins[sel]) {
						parentStack.push(parent)
						stack.unshift(q)
						parent = (new plugins[sel](parent, op + text, mapEnd ? "" : ";")).e
					} else {
						append(parent, all)
					}
				} else if (mapEnd) {
					appendBind(parent, text, "")
				} else {
					if (sel) {
						parentStack.push(parent)
						stack.unshift(q)
						append(parent, parent = El(sel))
					}
					if (text && op != "/") {
						if (op === ">") {
							replace(templateRe, work, indent + " " + text)
						} else if (op === "=") {
							append(parent, text) // + "\n")
						} else {
							if (op === "") {
								text = "txt _(" + quote(text) + ",$s)"
							}
							appendBind(parent, text, ";", op)
						}
					}
				}
			}
		}
		function viewShow(url) {
			if (url === true) {
				if (lastParams._p > 0) return
				url = lastUrl
				lastUrl = 0
			}
			var params = $d.params = { _t: Date.now() }
			, view = viewGet(url, params)
			if (!view.o || lastUrl !== url) {
				$d.url = lastUrl = expand(url)
				viewEmit(lastView = view, "nav", lastParams = params)
				bubbleUp(params)
			}
		}

		// Plugin properties:
		//   .n  name           .x  parent view name  .u  parent DOM element
		//   .e  container el   .d  done callback     .c  saved elCache (for %el/%view)
		// When proto is a function, plugin accumulates raw text:
		//   .r  raw handler    .t  accumulated text   .o  original op+text  .s  separator
		function addPlugin(name, proto, expectContent) {
			plugins[name] = Plugin
			function Plugin(parent, op, sep) {
				var plugin = this
				, arr = op.split(splitRe)
				plugin.n = arr[0] // name
				plugin.x = arr[1] // View parent
				plugin.u = parent
				if (plugin.r) {
					plugin.t = ""
					plugin.p = plugin.e = plugin
					plugin.o = op
					plugin.s = sep
				} else {
					if (expectContent) {
						elCache = create(plugin.c = elCache)
					}
					plugin.e = El(name === "svg" ? name : "div")
					plugin.e.p = plugin
				}
			}
			assign(Plugin.prototype, isFn(proto) ? { d: Function("p", "p.r(p.o+p.t)"), r: proto } : proto)
		}
		function usePluginContent(plugin) {
			var el = plugin.e
			, childNodes = el.childNodes
			, child = childNodes[1] ? ElWrap(childNodes) : childNodes[0]
			, contentPos = el._cp

			if (contentPos > -1) {
				if (childNodes[contentPos].nodeType < 2 && el._sk) {
					setAttr(childNodes[contentPos], "data-slot", el._sk)
				}
				child._s = el._s
			}
			if (plugin.c) elCache = plugin.c
			el.p = plugin.e = plugin.u = UNDEF
			return child
		}

		addPlugin("start", {
			d: Function("p", "p.u.i=1")
		})
		addPlugin("slot", {
			d: function(plugin) {
				var slotName = plugin.n || ++elSeq
				, parent = plugin.u
				append(parent, Comm("slot" + slotName))
				// In IE6 root div is inside documentFragment
				for (; (parent.parentNode || plugin).nodeType < 2; parent = parent.parentNode);
				;(parent._s || (parent._s = {}))[slotName] = parent.childNodes.length - 1
				if (!plugin.n) parent._s._ = parent._sk = slotName
				parent._cp = parent.childNodes.length - 1
			}
		})
		addPlugin("css", injectCss)
		addPlugin("def", viewDef)
		addPlugin("js", viewEval)
		addPlugin("each", function() {
			var txt = this.t
			each(this.o, function(param) {
				viewParse(replace(/{key}/g, param, txt))
			})
		})
		addPlugin("el", {
			d: function(plugin, el) {
				el = usePluginContent(plugin)
				elCache[plugin.n] = el
			}
		}, 1)
		plugins.svg = plugins.el
		addPlugin("map", function(txt) {
			var plugin = this
			appendBind(plugin.u, plugin.s ? txt.slice(1) : txt, plugin.s)
		})
		addPlugin("view", {
			d: function(plugin) {
				var expr = getAttr(plugin.e, "_b")
				, view = View(plugin.n, usePluginContent(plugin), plugin.x)
				if (expr) {
					viewEval(replace(renderRe, function(_, name, op, args) {
						return "($s." + name + (isFn(view[name]) ? "(" + (args || "") + ")" : "=" + args) + "),"
					}, expr) + "1", view)
				}
			}
		}, 1)

		/*** breakpoints ***/
		var breakpoints = opts.breakpoints
		, setBreakpointsRated = rate(function(width) {
			// document.documentElement.clientWidth is 0 in IE5
			bindingsIs(html, (width = html.offsetWidth), breakpoints, "")
			bindingsIs(html, +(width > html.offsetHeight), "port,1=land", "")
			emit(View, "resize")
		}, 99)

		if (breakpoints) {
			setBreakpointsRated()
			bindingsOn(window, "orientationchange resize", setBreakpointsRated)
		}
		/**/

		/*** i18n ***/
		globalScope._ = format
		var iFormat = create(NUL)
		each(opts.locales || { en: "en" }, function(translations, lang, locales) {
			translations = formatGet.t = assignDeep(assignDeep(create(opts.globals || NUL), locales), opts[lang])
			formatGet.g = getExt
			iFormat[lang] = formatGet
			var iAlias = {
				"#": "num", "num": "#",
				"*": "plural", "plural": "*",
				"?": "pick", "pick": "?",
				"@": "date", "date": "@",
				"~": "pattern", "pattern": "~"
			}
			, cache = create(NUL)
			, dateRe = /([Md])\1\1\1?|([YMDdHhmswSZ])(\2?)|[uUaSoQ]|'((?:''|[^'])*)'|(["\\\n\r\u2028\u2029])/g
			, date1 = new Date()
			, date2 = new Date()
			, iExt = formatGet.ext = {
				date: function(input, _mask, _zone) {
					var undef
					, offset = 4294967295
					, d = input * (input > offset || input < -offset ? 1 : 1000) || Date.parse(input)
					, t = translations["@"] || {}
					, mask = t[_mask] || _mask || "UTC:Y-MM-DD'T'HH:mm:ss'Z'"
					, zone = _zone != undef ? _zone : Date._tz != undef ? Date._tz : undef
					, utc = mask.slice(0, 4) == "UTC:"
					if (zone != undef && !utc) {
						offset = 60 * zone
						date1.setTime(d + offset * 6e4)
						utc = mask = "UTC:" + mask
					} else {
						date1.setTime(d)
						offset = utc ? 0 : -date1.getTimezoneOffset()
					}
					return isNaN(d) ? "" + date1 : (
						cache[mask] || (cache[mask] = Function("d,a,o,l", "var t;return \"" + dateStr(mask, utc) + "\"")))(
						date1,
						date2,
						offset,
						t
					)
				},
				lo: function(str) {
					return isStr(str) ? str.toLowerCase() : ""
				},
				map: function(input, str, sep, lastSep) {
					var arr = []
					each(input, function(val) {
						arr.push(formatGet(str, val))
					})
					lastSep = lastSep && arr.length > 1 ? lastSep + arr.pop() : ""
					return arr.join(sep || ", ") + lastSep
				},
				num: function(input, format) {
					var t = translations["#"] || {}
					return (
						cache[format = t[format] || "#" + format] || (cache[format] = Function("d", "var N=d<0&&(d=-d),n,r,o;return " + numStr(format, t)))
					)(input)
				},
				pattern: function(str, re) {
					var values = []
					, t = translations["~"] || {}
					, key = replace(RegExp(re || t[""] || "[\\d.]+", "g"), function(a) {
						values.push(a)
						return "#"
					}, str)
					return str != key ? replace(/#/g, bind(values.shift, values), iGet(t, key, str)) : str
				},
				pick: function(val, word) {
					var t = translations["?"] || {}
					return pick(val, t[word] || word)
				},
				plural: function(n, word, expr) {
					var t = translations["*"] || {}
					return (
						cache[expr = t[""] || "n!=1"] || (cache[expr] = Function("a,n", "return (a[+(" + expr + ")]||a[0]).replace('#',n)"))
					)((t[word] || "# " + word).split(";"), n)
				},
				up: function(str) {
					return isStr(str) ? str.toUpperCase() : ""
				}
			}

			function dateStr(mask, utc) {
				var get = "d.get" + (utc ? "UTC" : "")
				, dateMap = {
					d: "Day()||7",
					M: "Month()+1",
					D: "Date()",
					H: "Hours()",
					h: "Hours()%12||12",
					m: "Minutes()",
					s: "Seconds()",
					S: "Milliseconds()"
				}
				, setA = "a.setTime(+d+((4-(" + get + dateMap.d + "))*864e5))"
				return replace(dateRe, function(match, MD, single, pad, text, esc) {
					mask = (
						esc            ? replace(/%/g, "\\x", replace(/%u/g, "\\u", escape(esc))) :
						text !== UNDEF ? replace(/''/g, "'", text) :
						MD || match == "dd" ? "l[''][" + get + (MD == "M" ? "Month()+" + (match == "MMM" ? 14 : 26) : "Day()" + (pad ? (pad = "") : "+7")) + "]" :
						match == "u"   ? "(d/1000)>>>0" :
						match == "U"   ? "+d" :
						match == "Q"   ? "((" + get + "Month()/3)|0)+1" :
						match == "a"   ? "l[" + get + dateMap.H + ">11?'pm':'am']" :
						match == "o"   ? setA + ",a" + get.slice(1) + "FullYear()" :
						single == "Y"  ? get + "FullYear()" + (pad == "Y" ? "%100" : "") :
						single == "Z"  ? "(t=o)?(t<0?((t=-t),'-'):'+')+(t<600?'0':'')+(0|(t/60))" + (pad ? (pad = "") : "+':'") + "+((t%=60)>9?t:'0'+t):'Z'" :
						single == "w"  ? "Math.ceil(((" + setA + "-a.s" + get.slice(3) + "Month(0,1))/864e5+1)/7)" :
						get + dateMap[single || match]
					)
					return text !== UNDEF || esc ? mask : "\"+(" + (
						match == "SS" ? "(t=" + mask + ")>9?t>99?t:'0'+t:'00'+t" :
						pad ? "(t=" + mask + ")>9?t:'0'+t" :
						mask
					) + ")+\""
				}, (utc ? mask.slice(4) : mask))
			}

			function numStr(format, t) {
				// format;NaN;negFormat;0;Infinity;-Infinity;roundPoint
				// 🯰🯱🯲🯳🯴🯵🯶🯷🯸🯹
				var conf = format.split(";")
				, nan_value = conf[1] || "-"
				, o = (t.ordinal||"").split(";")
				, pre = {
					a: "(o+=d<1e3?'':d<1e6?(d/=1e3,'k'):d<1e9?(d/=1e6,'M'):d<1e12?(d/=1e9,'G'):d<1e15?(d/=1e12,'T'):d<1e18?(d/=1e15,'P'):(d/=1e18,'E')),"
				}
				, post = {
					o: "r+(o=" + JSON.stringify(o.slice(0,-1)) + "," + o.pop() + ")"
				}
				, m2 = /([^\d#]*)([\d# .,_·']*\/?\d+)(?:(\s*)([a-z%]+)(\d*))?(.*)/.exec(conf[0])
				, m3 = /([.,\/])(\d*)$/.exec(m2[2])
				, decimals = m3 && m3[2].length || 0
				, full = m3 ? m2[2].slice(0, m3.index) : m2[2]
				, num = replace(/\D+/g, "", full)
				, sLen = num.length
				, step = decimals ? +(m3[1] === "/" ? 1 / m3[2] : num + "." + m3[2]) : num
				, decSep = m3 && m3[1]
				, fn = "d===Infinity?(N?" + quote(conf[5]||nan_value) + ":" + quote(conf[4]||nan_value) + "):d>0||d===0?(o=" + quote(m2[3]) + "," + (pre[m2[4]] || "") + "n=" + (
					// Use exponential notation to fix float rounding
					// Math.round(1.005*100)/100 = 1 instead of 1.01
					decimals ?
					"d>1e-" + (decimals + 1) + "?(n=(d+'e" + decimals + "')/" + (step + "e" + decimals) + "":
					"d>"+num+"e-1?(n=d/" + num
				) + ",Math.floor(n" + (
					conf[6] == 1 ? "%1?n+1:n" : "+" + (conf[6] || 0.5)
				) + ")*" + step + "):0,r=" + (
					m2[5] ? "(''+(+n.toPrecision(" + (m2[5]) + ")))" :
					decimals ? "n.toFixed(" + decimals + ")" :
					"n+''"
				)

				if (decimals) {
					if (decSep == "/") {
						fn += ".replace(/\\.\\d+/,'" + (
							m3[2] == 5 ?
							"⅕⅖⅗⅘'.charAt(5" :
							"⅛¼⅜½⅝¾⅞'.charAt(8"
						) + "*(n%1)-1))"
					} else if (decSep != ".") {
						fn += ".replace('.','" + decSep + "')"
					}
					if (sLen === 0) {
						fn += ",n<1&&(r=r.slice(1)||'0')"
					}
				}
				if (sLen > 1) {
					if (decimals) sLen += decimals + 1
					fn += ",r=(r.length<" + sLen + "?(1e15+r).slice(-" + sLen + "):r)"
				}

				if ((num = full.match(/[^\d#][\d#]+/g))) {
					fn += ",r=" + numJunk(num.length - 1, 0, decimals ? decimals + 1 : 0)
				}

				fn += (
					(m2[4] ? ",r=" + (post[m2[4]] || "r+o") : "") +
					// negative format
					",N&&n>0?" + replace("#", "'+r+'", quote(conf[2] || "-#")) + ":" +
					(conf[3] ? "n===0?" + quote(conf[3]) + ":" : "") +
					(m2[1] ? quote(m2[1]) + "+r" : "r") +
					(m2[6] ? "+" + quote(m2[6]) : "")
				)

				return fn + "):" + quote(nan_value)

				function numJunk(i, lastLen, dec) {
					var len = lastLen + num[i].length - 1

					return "(n<1e" + len + (
						lastLen ? "?r.slice(0,-" + (lastLen + dec) + "):" : "?r:"
					) + (
						len < 16 ? numJunk(i?i-1:i, len, dec) : "r.slice(0,-" + (lastLen + dec) + ")"
					) + "+" + quote(num[i].charAt(0)) + "+r.slice(-" + (len + dec) + (
						lastLen ? ",-" + (lastLen + dec) : ""
					) + "))"
				}
			}

			function formatGet(str, data) {
				return format(iGet(translations, str, str || ""), data, getExt)
			}
			function getExt(obj, str) {
				var fn = cache[str] || (cache[str] = (replace(renderRe, function(_, name, op, args) {
					fn = (_ === name) ? name : "$el." + name + "(" + fn + (args ? "," + args : "") + ")"
				}, replace(/;\s*([#*?@~])(.*)/, function(_, op, arg) {
					return ";" + iAlias[op] + " " + quote(arg)
				}, str)), fn === str ? str : makeFn(fn, fn)))
				return str == "$" ? obj : isStr(fn) ? iGet(obj, str, "") : isFn(fn) ? fn(iExt, obj, translations) : ""
			}
		})
		;[localStorage.lang, opts.lang, navigator.language].concat(navigator.languages, html.lang, $d.locales = Object.keys(iFormat))
		.find(View.lang = function(lang, translations) {
			if (lang && (iFormat[lang = ("" + lang).toLowerCase()] || iFormat[lang = lang.split("-")[0]])) {
				assignDeep(iFormat[html.lang = $d.lang = localStorage.lang = lang].t, translations)
				return ($d._ = iFormat[lang])
			}
		})
		function format(str, data, getter) {
			for (var char, inQuote, inExpr, depth = 0, pos = 0, len = str.length; pos < len; ) {
				char = str.charAt(pos++)
				if (char == "'" || char == "\"") { // '"
					inQuote = (!inExpr || char === inQuote) ? "" : char
				} else if (inQuote) {
					if (char == "\\") pos++
				} else if (char == "{" && depth++ < 1) {
					inExpr = pos
				} else if (char == "}" && inExpr && --depth < 1) {
					char = getter(data, str.slice(inExpr, pos - 1), "")
					str = str.slice(0, inExpr - 1) + char + str.slice(pos)
					pos = inExpr + char.length - 1
					len = str.length
				}
			}
			return str
		}
		function iGet(obj, path, fallback, tmp) {
			return isStr(path) ? (
				NUL != obj[path] ? obj[path] :
				isStr(obj[tmp = path.toLowerCase()]) ? (
					path.slice(1) === tmp.slice(1) ? obj[tmp].charAt(0).toUpperCase() + obj[tmp].slice(1) :
					path === tmp.toUpperCase() ? obj[tmp].toUpperCase() :
					obj[tmp]
				) :
				(path = path.split("."))[1] && isObj(obj = obj[path[0]]) && isStr(obj[path[1]]) ? obj[path[1]] :
				fallback
			) :
			isArr(path) ? iGet(obj, path[0], tmp) || iGet(obj, path[1], tmp) || iGet(obj, path[2], fallback) :
			fallback
		}
		/*/
		globalScope._ = String
		/**/

		return View
	}

	function setUrl(url, rep) {
		/*** pushState ***/
		if (pushBase) {
			history[rep ? "replaceState" : "pushState"](NUL, NUL, pushBase + url)
		} else
		/**/
			location[rep ? "replace" : "assign"]("#" + url)
	}

	LiteJS.go = setUrl
	LiteJS.start = histStart
	function histStart(cb) {
		/*** pushState ***/
		// Chrome5, Firefox4, IE10, Safari5, Opera11.50
		var histLast
		, baseEl = find(html, "base")
		, url = getUrl()
		if (baseEl && history.pushState) {
			pushBase = replace(/.*:\/\/[^/]*|[^\/]*$/g, "", baseEl.href)

			if (url && !getUrl()) {
				setUrl(url, 1)
			}

			// Chrome and Safari emit a popstate event on page load, Firefox doesn't.
			// Firing popstate after onload is as designed.
			//
			// See the discussion on https://bugs.webkit.org/show_bug.cgi?id=41372,
			// https://code.google.com/p/chromium/issues/detail?id=63040
			// and the change to the HTML5 spec that was made:
			// http://html5.org/tools/web-apps-tracker?from=5345&to=5346.
			window.onpopstate = checkUrl
		} else
		/**/
			window.onhashchange = checkUrl
		readTemplates(checkUrl)
		function checkUrl() {
			if (cb && histLast != (histLast = getUrl())) cb(histLast)
		}
		function getUrl() {
			return replace(/^[#\/\!]+|[\s\/]+$/g, "",
				/*** pushState ***/
				pushBase ? location.pathname.slice(pushBase.length) :
				/**/
				// NOTE: in Firefox location.hash is decoded; in Safari location.pathname is decoded
				location.href.split("#")[1] || "")
		}
	}

	function Comm(name, render) {
		var comm = document.createComment(name)
		if (render) comm.render = render
		return comm
	}
	function El(name) {
		var attr
		, attrs = {}
		, el = replace(selectorRe, function(_, op, key, fn, val, quotation) {
			attr = 1
			val = quotation ? val.slice(1, -1) : val || key
			attrs[op =
				op === "." ?
				(fn = "~", "class") :
				op === "#" ?
				"id" :
				key
			] = fn && attrs[op] ?
				fn === "^" ? val + attrs[op] :
				attrs[op] + (fn === "~" ? " " : "") + val :
				val
			return ""
		}, name) || "div"

		// NOTE: IE-s cloneNode consolidates the two text nodes together as one
		// http://brooknovak.wordpress.com/2009/08/23/ies-clonenode-doesnt-actually-clone/
		el = (elCache[el] || (elCache[el] = document.createElement(el))).cloneNode(true)

		if (attr) {
			for (attr in attrs) setAttr(el, attr, attrs[attr])
		}

		return el
	}
	function ElWrap(nodes, clone) {
		for (var wrap = [], i = nodes.length; i--; ) {
			wrap[i] = clone ? nodes[i].cloneNode(clone) : nodes[i]
		}
		return assign(wrap, elArr)
	}

	assign(El, bindings, {
		emit: emit,
		empty: elEmpty,
		kill: elKill,
		off: acceptMany(rmEvent),
		render: render,
		rm: elRm
	})

	each(El, function(fn, key) {
		elArr[key] = function() {
			var arr = this
			, i = 0
			, len = arr.length
			, arg = slice.call(arguments)
			arg.unshift(1)
			for (; i < len; ) {
				arg[0] = arr[i++]
				fn.apply(El, arg)
			}
			return arr
		}
	})

	assign(El, {
		$b: assign(bindings, {
			each: function(el, name, list) {
				/*** debug ***/
				if (el._li) throw "Binding each must be type of once: each!" + name
				/**/

				var comm = Comm("each " + name, up)
				, pos = 0
				, nodes = []

				comm.$s = this
				elReplace(el, comm)
				each(list, add)
				return { a: add, u: up }

				function add(item) {
					var clone = nodes[pos] = el.cloneNode(true)
					, subScope = elScope(clone, comm)
					append(comm.parentNode, clone, (pos ? nodes[pos - 1] : comm).nextSibling)
					subScope.$i = pos++
					subScope.$len = list.length
					subScope[name] = item
					clone._b = el._b
					/*** debug ***/
					clone._li = up
					/**/
					render(clone)
				}
				function up() {
					for (var i = list.length; pos > i; ) elKill(nodes[--pos])
					for (nodes.length = i; pos < i; ) add(list[pos])
					for (; i--; ) nodes[i].$s[name] = list[i]
				}
			},
			el: function(el, tag, fallback) {
				tag = elCache[tag] ? tag : fallback
				if (el._el !== tag) {
					var child = El(tag)
					, tmp = child._elb = el._el ? el._elb : el._b
					if (tmp) appendBind(child, tmp, ";", "^")
					child.$s = el.$s
					child._el = tag
					elReplace(el, child)
					if ((tmp = child._elc = el._el ? (elKill(el), el._elc) : el.className)) cls(child, tmp)
					render(child)
					return true
				}
			},
			"if": function(el, enabled) {
				if (enabled) {
					elReplace(el._r, el)
				} else {
					elReplace(el, el._r || (el._r = Comm("if", bind(render, el, el, this))))
					return true
				}
			},
			is: bindingsIs,
			name: function(el, name) {
				setAttr(el, "name", expand(name, 1))
			},
			ref: function(el, name) {
				this[name] = el
			},
			$s: function(el) {
				var scope = this
				each(slice.call(arguments, 1), function(args) {
					each(args, function(arg, i) {
						if (isStr(i)) scope[i] = arg
						else scope[arg] = setAttr(el, arg, "")
					})
				})
			},
			view: function(el, url) {
				setAttr(el, "href", (pushBase || "#") + expand(url || ""))
			}
		}),
		$d: globalScope,
		append: append,
		asEmitter: asEmitter,
		blur: blur,
		cache: elCache,
		closest: closest,
		get: getAttr,
		hasClass: hasClass,
		matches: matches,
		nearest: nearest,
		rate: rate,
		replace: elReplace,
		scope: elScope,
		scrollLeft: bind(scrollPos, NUL, "pageXOffset", "scrollLeft"),
		scrollTop: bind(scrollPos, NUL, "pageYOffset", "scrollTop"),
		step: step,
		stop: eventStop
	})

	function setAttr(el, key, val) {
		var current = getAttr(el, key)

		// NOTE: IE5-7 doesn't set styles and removes events when you try to set them.
		// IE6 label with a for attribute will re-select the first option of SELECT list instead of just giving focus.
		// http://webbugtrack.blogspot.com/2007/09/bug-116-for-attribute-woes-in-ie6.html
		// IE8 and below have a bug where changed 'name' not accepted on form submit
		/* c8 ignore next 4 */
		/*** ie9 ***/
		if (ie678 && (key === "id" || key === "name" || key === "checked" || key === "style")) {
			el.mergeAttributes(document.createElement("<INPUT " + key + "='" + val + "'>"), false)
		} else if (key === "class" && isStr(el.className)) {
			// setAttribute("class") is broken in IE7, className is object on SVGElements
			el.className = val
		} else
		/**/
		if (val || val === 0) {
			if (current != val) {
				el.setAttribute(key, val)
			}
		} else if (current) {
			el.removeAttribute(key)
		}
		return current
	}

	function append(el, child, before) {
		if (!el.nodeType) {
			if (el.append) el.append(child, before)
			return
		}
		var next, tmp
		, i = 0
		if (child) {
			if (isStr(child) || isNum(child)) child = document.createTextNode(child)
			else if (!child.nodeType && (i = child.length)) {
				for (tmp = document.createDocumentFragment(); i--; ) append(tmp, child[i], 0)
				child = tmp
			}

			if (child.nodeType) {
				if ((i = setAttr(child, "slot", "") || getAttr(el, "data-slot"))) {
					i = "slot" + i
					for (tmp = el.firstChild; tmp; tmp = next) {
						if (tmp.nodeType === 8 && tmp.nodeValue === i) {
							el = tmp
							break
						}
						for (next = tmp.firstChild || tmp.nextSibling; !next && tmp !== el; next = tmp.nextSibling) {
							tmp = tmp.parentNode
						}
					}
				}
				if (el.nodeType === 8) {
					before = el
					el = before.parentNode
				}
				el.insertBefore(child, (
					isNum(before) ? el.childNodes[before < 0 ? el.childNodes.length + before : before] :
					isArr(before) ? before[0] :
					before
				) || NUL)
				/*** debug ***/
				if (el.namespaceURI && child.namespaceURI && el.namespaceURI !== child.namespaceURI && el.tagName !== "foreignObject" && child.tagName !== "svg") {
					console.error("NAMESPACE CHANGE!", el, child)
				}
				/**/
			}
		}
	}

	function appendBind(el, val, sep, q) {
		var current = getAttr(el, "_b")
		setAttr(el, "_b", (current ? (
			q === "^" ?
			val + sep + current :
			current + sep + val
		) : val))
	}

	function getClass(el) {
		var val = el.className
		return isStr(val) ? val : getAttr(el, "class") || ""
	}

	function hasClass(el, name) {
		return getClass(el).split(splitRe).indexOf(name) > -1
	}

	function cls(el, name, set) {
		// setAttribute("class") is broken in IE7
		// className is object on SVGElements
		var current = getClass(el)
		, SP = " "

		if (set === UNDEF || set) {
			if (set && set !== el && set.nodeType < 2) cls(set, name, 0)
			if (current) {
				name = (SP + current + SP).indexOf(SP + name + SP) > -1 ? current : current + SP + name
			}
		} else {
			name = current ? replace(SP + name + SP, SP, SP + current + SP).trim() : current
		}

		return current === name ? current : setAttr(el, "class", name)
	}

	function elEmpty(el) {
		for (; el.lastChild; elKill(el.lastChild));
	}
	function elKill(el, tr, delay) {
		if (el) {
			if (delay > 0) return setTimeout(elKill, delay, el, tr)
			if (tr) {
				if (isStr(tr)) cls(el, tr)
				if (isObj(tr)) bindingsCss(el, tr)
				tr = "transitionend"
				// transitionend fires for each property transitioned
				if ("on" + tr in el) return addEvent(el, tr, bind(elKill, el, el))
			}
			if (el._e) {
				emit(el, "kill")
				el._e = UNDEF
			}
			elRm(el)
			if (el.nodeType < 2) {
				el.$s = UNDEF
				elKill(el._r) // Replacement element like comment from if binding
				elEmpty(el)
				if (el.valObject !== UNDEF) {
					el.valObject = UNDEF
				}
			} else {
				if (el.kill) el.kill()
			}
		}
	}
	function elScope(el, parent) {
		return el.$s || (
			parent ? ((parent = elScope(parent)), el.$s = assign(create(parent), { $up: parent })) :
			closestScope(el)
		)
	}

	function closestScope(node) {
		for (; (node = node.parentNode); ) {
			if (node.$s) return node.$s
		}
		return globalScope
	}

	function render(node, $s) {
		if (!node || node.nodeType != 1) {
			if (node && node.render) node.render()
			return
		}

		var el, next
		, scope = node.$s || $s || closestScope(node)

		/*** ie9 ***/
		if (ie678 && node.tagName === "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		/**/

		if (hydrate(node, "_b", scope)) return
		for (el = node.firstChild; el; el = next) {
			next = el.nextSibling
			render(el, scope)
		}
		hydrate(node, "data-out", scope)
	}

	// Reads binding expression from DOM attr (_b or data-out), compiles via makeFn, executes.
	// Caches expr on node[attr] to avoid re-reading DOM; true = no bindings (already processed).
	// Returns truthy if binding replaced the element (if/each), so render() skips children.
	function hydrate(node, attr, scope) {
		var fn
		, expr = node[attr] || (node[attr] = setAttr(node, attr, "") || true)
		if (expr !== true) try {
			fn = fnCache[expr] || (fnCache[expr] = makeFn(expr))
			return fn(node, scope, attr, bindOnce, elScope)
		} catch (e) {
			throw e + "\n" + attr + ": " + expr
		}
	}
	// Compiles binding expression string (e.g. ";txt foo;cls 'active',bar") into a Function.
	// Extracts free variable names and aliases them from scope ($s.varName).
	// raw parameter bypasses the $s guard wrapper (used by i18n getExt).
	function makeFn(fn, raw, i) {
		fn = raw || "$s&&(" + replace(renderRe, function(match, name, op, args) {
			return (
				op ? "($el[$a]=$el[$a].replace($o[" + (i = bindOnce.indexOf(match), i < 0 ? bindOnce.push(match) - 1 : i)+ "],''),0)||" : ""
			) + "$b['" + (bindings[name] ? name + "'].call($s" + (name == "$s" ? "=$S($el,$el)": "") + ",$el" : "set']($el,'" + name + "'") + (args ? "," + args : "") + ")||"
		}, fn) + "$r)"
		var vars = replace(fnRe, "", fn).match(wordRe) || []
		for (i = vars.length; i--; ) {
			if (window[vars[i]] || vars.indexOf(vars[i]) !== i) vars.splice(i, 1)
			else vars[i] += "=$s." + vars[i]
		}
		fn = Function("$el,$s,$a,$o,$S,$r", (vars[0] ? "var " + vars : "") + ";return " + fn)
		return fn
	}

	/*** kb ***/
	var kbMaps = []
	, kbMod = LiteJS.kbMod = /\bMac|\biP/.test(navigator.userAgent) ? "metaKey" : "ctrlKey"
	, kbCodes = LiteJS.kbCodes = ",,,,,,,,backspace,tab,,,,enter,,,shift,ctrl,alt,pause,caps,,,,,,,esc,,,,,,pgup,pgdown,end,home,left,up,right,down,,,,,ins,del,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,cmd,,,,,,,,,,,,,,,,,,,,,f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12".split(splitRe)

	El.addKb = addKb
	El.rmKb = rmKb
	function addKb(map, killEl) {
		if (map) {
			kbMaps.unshift(map)
			if (killEl) {
				addEvent(killEl, "kill", bind(rmKb, map, map))
			}
		}
	}
	function rmKb(map) {
		map = kbMaps.indexOf(map)
		if (map > -1) kbMaps.splice(map, 1)
	}

	addEvent(document, "keydown", function(e) {
		if (kbMaps[0]) {
			var c = e.keyCode || e.which
			, numpad = c > 95 && c < 106
			, code = numpad ? c - 48 : c
			, key = kbCodes[code] || String.fromCharCode(code).toLowerCase() || code

			// Otherwise IE backspace navigates back
			if (code == 8 && kbMaps[0].backspace) {
				eventStop(e)
			}
			runKb(key)
			if (e.shiftKey && code != 16) runKb("shift+" + key)
			// people in Poland use Right-Alt+S to type in Ś.
			// Right-Alt+S is mapped internally to Ctrl+Alt+S.
			// THANKS: Marcin Wichary - disappearing Polish Ś [https://medium.engineering/fa398313d4df]
			if (e.altKey) {
				if (code != 18) runKb("alt+" + key)
			} else if (code != 17) {
				if (e.ctrlKey) runKb("ctrl+" + key)
				if (e[kbMod] && code != 91) runKb("mod+" + key)
			}
		}
		function runKb(chr) {
			for (
				var fn, map
				, i = 0
				, el = e.target
				, input = /INPUT|TEXTAREA|SELECT/i.test((el.nodeType < 2 ? el : el.parentNode).tagName);
				(map = kbMaps[i++]) && !(
					fn = !input || map.input ? map[code] || map[chr] || map.num && code > 47 && code < 58 && (chr|=0, map.num) || map.all : fn
				) && map.bubble; );
			if (isStr(fn)) setUrl(fn)
			if (isFn(fn)) fn(e, chr, el)
		}
	})
	/**/

	/*** touch ***/
	var touchEl, touchDist, touchAngle, touchMode, touchTick
	, START = "start"
	, END = "end"
	, touches = []
	, touchEv = {}

	// swipe + left/right/up/down
	each("hold pan pinch rotate tap", function(name) {
		fixEv[name] = fixEv[name + START] = fixEv[name + END] = ""
		fixFn[name] = touchInit
	})
	function touchInit(el) {
		if (!el._ti) {
			addEvent(el, "pointerdown", touchDown)
			addEvent(el, "wheel", touchWheel)
			bindingsOn(el, "pointerup pointercancel", touchUp)
			bindingsCss(el, "touchAction msTouchAction", "none")
			el._ti = 1
		}
		function touchDown(e, e2) {
			clearTimeout(touchTick)
			var len = e ? touches.push(e) : touches.length
			, MOVE = "pointermove"
			if (touchMode || len < 1) {
				emit(touchEl, touchMode ? touchMode + END : "tap", e2, touchEv, touchEl)
				touchMode = UNDEF
			}
			if (len < 1) {
				touchEl = UNDEF
			}
			if (len === 1) {
				if (e) {
					touchEl = e.currentTarget || e.target
					touchEv.X = e.clientX
					touchEv.Y = e.clientY
					touchPos("left", "offsetWidth")
					touchPos("top", "offsetHeight")
					if (e.button === 2 || matches(touchEl, "INPUT,TEXTAREA,SELECT,.no-drag")) return
					touchTick = setTimeout(moveOne, LiteJS.holdDelay || 800, e, 1)
				}
				moveOne(e || touches[0])
			}
			if (len === 2) {
				touchDist = touchAngle = UNDEF
				moveTwo(e)
			}
			;(len === 1 ? addEvent : rmEvent)(document, MOVE, moveOne)
			;(len === 2 ? addEvent : rmEvent)(document, MOVE, moveTwo)
			function touchPos(name, offset) {
				var val = (
					touchEl.getBBox ?
					touchEl.getAttributeNS(NUL, name == "top" ? "y":"x") :
					touchEl.style[name]
				)
				touchEv[name] = parseInt(val, 10) || 0
				if (val && val.indexOf("%") > -1) {
					touchEv[name] *= touchEl.parentNode[offset] / 100
				}
			}
		}
		function touchUp(e) {
			for (var i = touches.length; i--; ) {
				if (touches[i].pointerId == e.pointerId) {
					touches.splice(i, 1)
					break
				}
			}
			touchDown(UNDEF, e)
		}
		function touchWheel(e) {
			// IE10 enabled pinch-to-zoom gestures from multi-touch trackpad’s as mousewheel event with ctrlKey.
			// Chrome M35 and Firefox 55 followed up.
			// alt+wheel may be OS level zoom, use shiftKey as alternative
			if (!touches[0]) {
				var ev = e.ctrlKey ? "pinch" : e.altKey || e.shiftKey ? "rotate" : UNDEF
				if (ev && emit(e.currentTarget || e.target, ev, e, e.deltaY/20, 0)) {
					return eventStop(e)
				}
			}
		}
		function moveOne(e, fromTimer) {
			// In IE9 mousedown.buttons is OK but mousemove.buttons == 0
			if (touches[0].buttons && touches[0].buttons !== (e.buttons || [0, 1, 4, 2][e.which || 0])) {
				return touchUp(e)
			}
			touchEv.x = e.clientX - touchEv.X
			touchEv.y = e.clientY - touchEv.Y
			touchEv.leftPos = touchEv.x + touchEv.left
			touchEv.topPos  = touchEv.y + touchEv.top
			if (!touchMode) {
				var evs = touchEl._e
				touchMode = (
					haveEv("pan", touchEv.x > 10 || touchEv.x < -10 || touchEv.y > 10 || touchEv.y < -10) ||
					haveEv("hold", fromTimer)
				)
				if (!touchMode) return
				clearTimeout(touchTick)
				emit(touchEl, touchMode + START, e, touchEv, touchEl)
			}
			emit(touchEl, touchMode, e, touchEv, touchEl)
			function haveEv(name, set) {
				return set && (evs[name] || evs[name + START] || evs[name + END]) && name
			}
		}
		function moveTwo(e) {
			touches[ touches[0].pointerId == e.pointerId ? 0 : 1] = e
			var diff
			, x = touchEv.X - touches[1].clientX
			, y = touchEv.Y - touches[1].clientY
			, dist = Math.sqrt(x*x + y*y) | 0
			, angle = Math.atan2(y, x)

			if (touchDist !== UNDEF) {
				diff = dist - touchDist
				if (diff) emit(touchEl, "pinch", e, diff, angle)
				// GestureEvent onGestureChange: function(e) {
				//	e.target.style.transform =
				//		'scale(' + e.scale  + startScale  + ') rotate(' + e.rotation + startRotation + 'deg)'
				diff = angle - touchAngle
				if (diff) emit(touchEl, "rotate", e, diff * (180/Math.PI))
			}
			touchDist = dist
			touchAngle = angle
		}
	}
	/**/

	function bindingsIs(el, val, opts, prefix) {
		if (!isStr(prefix)) prefix = "is-"
		var match = pick(val, opts)
		cls(el, el[prefix + opts], 0)
		cls(el, el[prefix + opts] = match && prefix + match)
	}
	function pick(val, word) {
		for (var arr = replace(/([^;=,]+?)\?/g, "$1=$1;", word).split(/[;=,]/), i = 1|arr.length; i > 0; ) {
			if ((i-=2) < 0 || arr[i] && (arr[i] == "" + val || +arr[i] <= val)) {
				return arr[i + 1] ? replace("#", val, arr[i + 1]) : ""
			}
		}
	}
	function closest(el, sel) {
		return el && html.closest.call(el.nodeType < 2 ? el : el.parentNode, sel)
	}
	function find(root, sel, startNode) {
		return html.querySelector.call(startNode || root, sel)
	}
	function findAll(root, sel, startNode) {
		return ElWrap(html.querySelectorAll.call(startNode || root, sel))
	}
	function matches(el, sel) {
		return el && html.matches.call(el, sel)
	}
	function nearest(el, sel) {
		return el ? find(el, sel) || nearest(el.parentNode, sel) : NUL
	}
	// Wraps fn to accept: space-separated names, object maps {name:val}, CSS selectors, delays.
	// prepareVal=1: wraps val as event delegate (string val→emit on view, fn+selector→delegation)
	// After arg normalization, selector is reused as element array, delay as loop counter.
	function acceptMany(fn, prepareVal) {
		return function f(el, name, val, selector, delay, data) {
			if (el && name) {
				if (isNum(selector)) {
					data = delay
					delay = selector
					selector = UNDEF
				} else if (isArr(selector) || isObj(selector)) {
					data = selector
					delay = selector = UNDEF
				}
				if (delay > 0) {
					setTimeout(f, delay, el, name, val, selector, 0, data)
					return
				}
				if (isObj(name)) {
					for (delay in name) if (hasOwn(name, delay)) {
						f(el, delay, name[delay], val, 0, data)
					}
					return
				}
				if (prepareVal) val = delegate(el, val, selector, data)
				selector = !prepareVal && selector ? findAll(el, selector) : isArr(el) ? el : [ el ]
				for (delay = 0; (el = selector[delay++]); ) {
					for (var result, arr = ("" + name).split(splitRe), i = 0, len = arr.length; i < len; i++) {
						if (arr[i]) {
							result = fn(el, arr[i], isArr(val) ? val[i] : val, data)
							if (!prepareVal && data > 0) f(el, name, result, "", data)
						}
					}
				}
			}
		}
		function delegate(el, val, selector, data) {
			return isStr(val) ? function(e) {
				var target = selector ? closest(e.target, selector) : el
				if (target) emit.apply(target, [elScope(el).$ui, val, e, target].concat(data))
			} :
			selector ? function(e, touchEv, touchEl) {
				if (matches(touchEl = e.target, selector)) val(e, touchEv, touchEl, data)
			} :
			val
		}
	}
	function assignDeep(target, map) {
		if (map) for (var k in map) if (hasOwn(map, k)) {
			if (isObj(map[k]) && isObj(target[k]) && hasOwn(target, k)) assignDeep(target[k], map[k])
			else target[k] = map[k]
		}
		return target
	}
	function blur() {
		// IE8 can throw on accessing document.activeElement.
		try {
			document.activeElement.blur()
		} catch(e) {}
	}
	function each(arr, fn, scope, key) {
		if (arr) {
			if (isStr(arr)) arr = arr.split(splitRe)
			if (isArr(arr)) arr.forEach(fn, scope)
			else for (key in arr) if (hasOwn(arr, key)) fn.call(scope, arr[key], key, arr)
		}
	}
	function expand(str, ns) {
		var first = str.charAt(0)
		, rest = str.slice(1)
		, lastExp = expand[ns]
		return (
			first === "+" ? lastExp + rest :
			first === "%" ? ((first = lastExp.lastIndexOf(rest.charAt(0))), (first > 0 ? lastExp.slice(0, first) : lastExp)) + rest :
			(expand[ns] = str)
		)
	}
	function injectCss(cssText) {
		if (!styleNode) {
			// Safari and IE6-8 requires dynamically created
			// <style> elements to be inserted into the <head>
			append(find(html, "head"), styleNode = El("style"))
		}
		if (styleNode.styleSheet) styleNode.styleSheet.cssText += cssText
		else append(styleNode, cssText)
	}
	function isFn(fn) {
		// old WebKit returns "function" for HTML collections
		return typeof fn === "function"
	}
	function isNum(num) {
		return typeof num === "number"
	}
	function isObj(obj) {
		return !!obj && obj.constructor === Object
	}
	function isStr(str) {
		return typeof str === "string"
	}
	function quote(str) {
		return "'" + replace(/\n/g, "\\n", replace(/'/g, "\\'", str || "")) + "'"
	}
	// Maximum call rate for Function with optional leading edge and trailing edge
	function rate(fn, ms, onStart, onEnd) {
		var tick
		, next = 0
		onStart = isFn(onStart) ? onStart : (onStart === tick || onStart) && fn
		onEnd = isFn(onEnd) ? onEnd : (onEnd === tick || onEnd) && fn
		return function() {
			var now = Date.now()
			clearTimeout(tick)
			if (now >= next) {
				if (next < 1) {
					if (onStart) onStart()
				} else fn()
				next = now + ms
			}
			if (onEnd) {
				tick = setTimeout(onEnd, next - now)
			}
		}
	}
	function scrollPos(page, key) {
		return window[page] || html[key] || body[key] || 0
	}
	function step(num, factor, mid) {
		var x = ("" + factor).split(".")
		, steps = num / factor
		, n = ~~(steps + ((steps < 0 ? -1 : 1) * (mid == UNDEF ? 0.5 : mid === 1 && steps == (steps|0) ? 0 : +mid))) * factor
		return "" + (1 in x ? n.toFixed(x[1].length) : n)
	}

	function readTemplates(next) {
		xhr.load(findAll(html, "script[type=ui]").map(function(el) {
			// IE6 script.innerText is empty
			sources.push(el.innerHTML)
			elKill(el)
			return el.src
		}), function(res) {
			res = res.concat(sources, next && next.src && next.innerHTML)
			if (res[sources.length = 0]) {
				if (!parser) LiteJS.ui = LiteJS()
				each(res, parser)
			}
			if (isFn(next)) next()
		}, 1)
	}
	readTemplates(findAll(html, "script").pop())
}(this, document, history, localStorage, location, navigator, Function, Object) // jshint ignore:line


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
	, lineRe = /{([.\w]+)}/g
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
			own.lastMsg = "Can not be strictEqual"
			return this(actual !== expected && own(actual, expected), message || own.lastMsg, actual, expected)
		},
		notOwn: function(actual, expected, message) {
			own.lastMsg = "Can not be strictEqual"
			return this(actual !== expected && !own(actual, expected), message || own.lastMsg, actual, expected)
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
		cut: 15000,
		delay: 1,
		seed: 1 + (Math.random() * 1e5)|0,
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
	assert.has = assert.own
	assert.hasNot = assert.notOwn
	function fakeDate(year, month, date, hr, min, sec, ms) {
		return (
			arguments.length > 1 ?
			new _Date(num(year), num(month), num(date, 1), num(hr, 0), num(min, 0), num(sec, 0), num(ms, 0)) :
			new _Date(num(year, fakeNow))
		)
	}
	fakeDate.prototype = _Date.prototype
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

	_Error.stackTraceLimit = +conf.stack + 5

	describe.describe = describe
	describe.test = curry(def, 2)
	describe.it = curry(def, 3)
	describe.should = curry(def, 4)
	describe.failed = 0
	describe.output = ""

	describe.diff = diff
	describe.equal = function(actual, expected) {
		return _deepEqual(actual, expected, [])
	}
	describe.format = format
	describe.opts = opts
	describe.print = print
	describe.stringify = stringify
	describe.type = type

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
				if (message) {
					expected = "expected: " + stringify(expected, conf.cut)
					actual   = "actual:   " + stringify(actual, conf.cut)
					if (conf.color && expected.length > 80) {
						message += "\n" + diff(expected, actual, ["\n", " ", ","], conf.red, conf.reset, conf.green, conf.reset)
					} else {
						message += "\n" + expected + "\n" + actual
					}
				} else {
					message = stringify(value, conf.cut) + " is truthy"
				}
				fail("Assertion:" + testCase.total + ": " + message)
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
		conf.pass = totalCases - conf.fail - skipped
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
				print(testCase.errors.join("\n\n"))
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
	function diff(a, b, sep, r1, r2, g1, g2) {
		var del, ins, pre, aLen, bLen
		, aPos = 0
		, bPos = 0
		, offset = 0
		, out = []

		if (_isArray(sep)) {
			for (del = 0; (ins = sep[del++]) && a.split(ins).length < 3; );
			sep = ins
		}
		sep = sep || ""
		a = a.split(sep)
		b = b.split(sep)

		for (aLen = a.length, bLen = b.length; aPos < aLen || bPos < bLen; aPos++, bPos++) {
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
					out.push([aPos - del + offset, del, b.slice(bPos - ins, bPos).join(sep)])
					offset += 1 - del
				}
			}
		}
		if (r1) {
			for (bPos = 0; (b = out[bPos++]); ) {
				a.splice(b[0], b[1],
					(b[1] ? r1 + a.slice(b[0], b[0] + b[1]).join(sep) + r2 : "") +
					(b[2] ? g1 + b[2] + g2 : "")
				)
			}
			out = a.join(sep)
		}
		return out
	}
	function format(str, obj, fallback) {
		return str.replace(lineRe, function(_, path, tmp) {
			return obj[path] != null ? obj[path] :
				(_ = path.split("."))[1] && (tmp = obj[_[0]]) && tmp[_[1]] != null ? tmp[_[1]] :
				fallback[path]
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
		fn: function(origin, behavior) {
			spy.called = 0
			spy.calls = []
			spy.errors = 0
			spy.results = []
			return spy
			function spy() {
				var err = null, key, result
				, args = slice(arguments)
				if (isFn(origin)) {
					try {
						result = origin.apply(this, args)
					} catch(e) {
						spy.errors++
						err = e
					}
				} else if (isObj(origin)) {
					key = stringify(args).slice(1, -1)
					result = hasOwn(origin, key) ? origin[key] : origin["*"]
				} else result = _isArray(origin) ? origin[spy.called % origin.length] : origin
				spy.called++
				push(spy.results, result)
				push(spy.calls, {
					scope: this,
					args: args,
					error: err,
					result: result
				})
				if (type(behavior) === "number") args[behavior].call(this, err, result)
				else return behavior === true ? (err ? Promise.reject(err) : Promise.resolve(result)) : result
			}
		},
		rand: function(seed) {
			seed = 0|seed || conf.seed
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
			push(this._r, obj, name, hasOwn(obj, name) && { v: existing })
			obj[name] = fn
			if (fn === fn && obj[name] !== fn) throw _Error("Unable to swap " + stringify(name))
			return existing
		},
		restore: function() {
			for (var arr = this._r, i = arr.length; --i > 0; i -= 2) {
				if (arr[i]) {
					arr[i - 2][arr[i - 1]] = arr[i].v
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
			return (a >>> 0) / 4294967296
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
		if (a) {
			for (var k in b) if (hasOwn(b, k)) {
				if (!hasOwn(a, k) || (
					isObj(b[k]) ? !own(a[k], b[k]) :
					!_deepEqual(a[k], b[k], [])
				)) {
					own.lastMsg = own.lastMsg || k + " does not match"
					return false
				}
			}
			return true
		} else {
			own.lastMsg = "actual is " + a
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

	function stringify(item, max) {
		var circ = []
		, cut = max > 5 ? max : _Infinity
		, left = cut
		, str = _stringify(item)
		return str.length > cut ? str.slice(0, cut - 3) + ".." + str.slice(-1) : str
		function _stringify(item) {
			var i, t, tmp
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
					i = (t === "object" ? _stringify(i) + ":" : "") + _stringify(str[i])
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
	}
}(this, setTimeout, clearTimeout, Date, Error, Infinity) // jshint ignore:line

