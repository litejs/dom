

var { CSS } = require("./css.js")
, boolAttrs = exports.boolAttrs = {
	async:1, autoplay:1, loop:1, checked:2, defer:1, disabled:1, muted:1, multiple:1, nomodule:1, playsinline:1, readonly:1, required:1, selected:2
}
, defaultAttrs = {
	"form method get":1, "input type text":1,
	"script type text/javascript":1, "style type text/css":1
}
, voidElements = exports.voidElements = {
	AREA:1, BASE:1, BR:1, COL:1, EMBED:1, HR:1, IMG:1, INPUT:1, KEYGEN:1, LINK:1, MENUITEM:1, META:1, PARAM:1, SOURCE:1, TRACK:1, WBR:1
}
, svgVoidElements = exports.svgVoidElements = {
	circle:1, ellipse:1, image:1, line:1, path:1, polygon:1, polyline:1, rect:1, stop:1, use:1,
}
, rawTextElements = exports.rawTextElements = { SCRIPT: /<(?=\/script)/i, STYLE: /<(?=\/style)/i }
, quotedAttrRe = /[\s"'`=<>]/
, escFn = chr => chr === "<" ? "&lt;" : chr === ">" ? "&gt;" : "&amp;"

exports.stringify = stringify

function stringify(node, opts, inner) {
	var doc = node.ownerDocument || node
	, isXml = doc.contentType === "application/xml"
	, voidEl = (doc.documentElement || 0).tagName === "svg" ? svgVoidElements : voidElements
	, hasOwn = voidEl.hasOwnProperty
	, escRe = isXml ? /[<&>]/g : /<|&(?=[a-z#])/gi

	return inner ? stringifyContent(node) : stringifyEl(node)

	function stringifyEl(el) {
		var attrs, content, type = el.nodeType
		return (
			type === 1 ? (
				content = voidEl[el.tagName] ? "" : stringifyContent(el),
				opts && el.tagName === "STYLE" && !content.trim() ? "" :
				"<" + el.localName + ((attrs = stringifyAttrs(el)) ? " " + (attrs.slice(-1) === "/" ? attrs + " " : attrs) : "") +
				(voidEl[el.tagName] ? (isXml ? "/>" : ">") : ">" + content + "</" + el.localName + ">")
			) :
			type === 3 ? (opts ? ("" + el.data).trim() : "" + el.data).replace(escRe, escFn) :
			type === 8 ? (opts ? "" : "<!--" + el.data + "-->") :
			type === 10 ? "<" + el.data + ">" :
			stringifyContent(el)
		)
	}
	function stringifyAttrs(el) {
		var i = 0
		, map = el.attributes
		, tagName = el.tagName
		, arr = []
		for (; i < map.length; i++) {
			var attr = map[i]
			, name = attr.name
			, loName = name.toLowerCase()
			, value = attr.value
			if (loName === "style" && opts && el.style) value = el.style.cssText
			value = value.replace(escRe, escFn)
			if (!isXml) {
				if (hasOwn.call(boolAttrs, loName)) { arr.push(name); continue }
				if (opts) {
					value = loName.slice(0, 2) === "on" ? value.replace(/^[\s\uFEFF\xA0;]+|[\s\uFEFF\xA0;]+$/g, "") : value.replace(/\s+/g, " ").trim()
					if (defaultAttrs[(tagName + " " + name + " " + value).toLowerCase()]) continue
					if (!quotedAttrRe.test(value)) { arr.push(name + "=" + value); continue }
					if (value.split("\"").length > value.split("'").length) { arr.push(name + "='" + value.replace(/'/g, "&#39;") + "'"); continue }
				}
				name = loName
			}
			arr.push(name + "=\"" + value.replace(/"/g, "&quot;") + "\"")
		}
		return arr.join(" ")
	}
	function stringifyContent(el) {
		return rawTextElements[el.tagName] ? (
			el.tagName === "STYLE" && (opts === true || opts && opts.css) ? "\n" + CSS.minify(el.sheet, typeof opts.css === "object" ? opts.css : null) + "\n" :
			el.textContent
		) : Array.prototype.map.call(el.childNodes, stringifyEl).join("")
	}
}

