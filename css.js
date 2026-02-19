
/*! litejs.com/MIT-LICENSE.txt */

"use strict"

/* c8 ignore next */
var URL = global.URL || require("url").URL

exports.CSSStyleDeclaration = CSSStyleDeclaration
exports.CSSStyleSheet = CSSStyleSheet
exports.CSS = {
	escape(sel) {
		return ("" + sel).replace(/[^a-zA-Z0-9_\u00A0-\uFFFF-]/g, "\\$&").replace(/^(-?)([0-9])/, "$1\\3$2 ")
	},
	minify(sheet, opts) {
		var rules = sheet.cssRules || sheet.rules
		return Array.prototype.map.call(rules, function(rule) {
			var text = clear(rule.cssText)
			if (!text || /\{\s*\}$/.test(text)) return ""
			if (opts && opts.color) text = text.replace(colorRe, colorFn)
			return text
		}).filter(Boolean).join("\n")
	}
}

var toUrl = (dir) => new URL((dir || ".").replace(/\/+$/, "") + "/", "file:///").href
, read = (sheet, url, enc = "utf8") => require("fs").readFileSync(new URL(url, new URL((sheet.baseURI || ".") + "/", new URL((sheet.min.root || ".").replace(/\/+$/, "") + "/", "file:///" + process.cwd() + "/"))).pathname.split(/[+#]/)[0], enc)
, plugins = exports.plugins = {
	"data-uri": function(sheet, v) {
		var { DOMParser } = require("./dom.js")
		return v.replace(urlRe, function(_, q1, q2, url) {
			if (q1) return _
			var frag = url.split("#")[1]
			, ext = url.split(/[?#]/)[0].split(".").pop()
			, enc = ext === "svg" ? "utf8" : "base64"
			url = read(sheet, url, enc)
			if (ext === "svg") {
				url = new DOMParser().parseFromString(url, "application/xml")
				if (frag && (frag = url.getElementById(frag))) {
					frag.removeAttribute("id")
					url.documentElement.childNodes = frag.tagName === "g" ? frag.childNodes : [ frag ]
				}
				url = url.toString(true).replace(/#/g, "%23")
				enc = ""
				ext += "+xml"
			}
			return "url('data:image/" + ext + ";" + enc + "," + url + "')"
		})
	}
}
, urlRe = /(["']).*?\1|url\((['"]?)(?!\/|data:|https?:)(.*?)\2\)/g
, clearFn = (_, q, str, c) =>
	q ? (q = str.indexOf("'") == -1 ? "'" : "\"", q + str.replace(q === "'" ? /\\(")/g : /\\(')/g, "$1")) + q :
	c ? "" :
	_.replace(/[\t\n]+/g, " ")
	.replace(/ +(?=[,;{}>~+\/])/g, "").replace(/([,;{}>~+\/]) +/g, "$1")
	.replace(/;(?=})/g, "")
	.replace(/: +/g, ":")
	.replace(/([ :,])0\.([0-9])/g, "$1.$2")
, clear = s => s
	.replace(/("|')((?:\\.|[^\\\1])*?)\1|\s*(\/)\*(?:[^*]|\*(?!\/))*\*\/\s*|(?:[^"'\/]|\/(?!\*))+/g, clearFn)
	.replace(/(["']).*?\1|url\(("|')([^'"()\s]+)\2\)/g, (m,q1,q2,u) => q1 ? m : "url(" + u + ")")
, hex = n => (0 | +n + 256.5).toString(16).slice(1)
, toRgb = {
	rgb: (r, g, b) => hex(r) + hex(g) + hex(b),
	hsl(h, s, l) {
		l /= 100
		s /= 100 / (l < 0.5 ? l : 1 - l)
		function f(n) {
			n = (n + h / 30) % 12
			return hex(255 * (l - s * (n < 2 || n > 10 ? -1 : n < 4 ? n - 3 : n > 8 ? 9 - n : 1)))
		}
		return f(0) + f(8) + f(4)
	}
}
, toRgba = (rgbHex, alpha) => ("rgba(" + rgbHex.replace(/../g, x => parseInt(x, 16)+",") + alpha + ")").replace("0.", ".")
, colorRe = /\b(rgb|hsl)a?\s*\(\s*(\d+)(?:deg)?[\s,]+(\d+)[\s,%]+(\d+)%?(?:[\s,\/]+(0?\.?\d+)(%?))?\s*\)/g
, colorFn = (_, name, a, b, c, d, p) => (_ = toRgb[name](a, b, c), (p ? d/=100 : d) < 1 ? toRgba(_, d) : "#" + _.replace(/(\w)\1(\w)\2(\w)\3/, "$1$2$3"))
, styleHandler = {
	get(style, prop) {
		if (prop === "cssText") {
			var min = style.parentRule && style.parentRule.parentStyleSheet.min
			for (var out = [], name, value, i = style.length; i--; ) {
				name = style[i]
				value = style.__[i] || style[name]
				if (min && min.color) value = value.replace(colorRe, colorFn)
				out[i] = name + ":" + value
			}
			return out.join(";")
		}
		return style[prop] || ""
	},
	set(style, prop, val) {
		if (prop === "cssText") {
			var m, k
			, sheet = style.parentRule && style.parentRule.parentStyleSheet
			, min = sheet && sheet.min
			, re = /([*_]?[-a-z]+)\s*:((?:("|')(?:\\.|(?!\3)[^\\])*?\3|[^"';])+)|\/\*!?((?:[^*]|\*(?!\/))*)\*\//ig
			, len = 0
			, lastIdx = {}
			for (; (m = re.exec(val)); ) {
				if (m[4]) {
					if (min && len && plugins[m[4] = m[4].trim()]) style[k = style[len - 1]] = clear(plugins[m[4]](sheet, style[k]))
				} else {
					k = m[1]
					if (lastIdx[k] >= 0) style.__[lastIdx[k]] = style[k]
					style[style[lastIdx[k] = len++] = k] = style[
						k === "float" ? "cssFloat" : k.replace(/-([a-z])/g, (_, a) => a.toUpperCase())
					] = clear(m[2]).trim()
				}
			}
			style.length = len
		} else {
			if (!style[prop]) style[style.length++] = prop
			style[prop] = style[prop === "cssFloat" ? "float" : prop.replace(/[A-Z]/g, "-$&").toLowerCase()] = clear(val)
		}
		return true
	}
}
, ruleTypes = {
	style: {
		type: 1,
		get cssText() {
			return this.style.length > 0 ? this.selectorText + "{" + this.style.cssText + "}" : ""
		},
		set cssText(text) {
			var idx = text.indexOf("{")
			this.selectorText = clear(text.slice(0, idx).trim())
			this.style = CSSStyleDeclaration(text.slice(idx + 1).replace(/}\s*/, ""), this)
		}
	},
	import: {
		get cssText() {
			var sheet = this.parentStyleSheet
			, min = sheet.min
			, text = this.text
			, urlFn = (m,q1,q2,u) => q1 ? m : "url('" + new URL(u, toUrl(text.baseURI)).pathname.slice(1) + "')"
			if (min && min.import) {
				text = new CSSStyleSheet({
					parentStyleSheet: sheet,
					href: this.href,
					min
				}, read(sheet, this.href))
				if (sheet.baseURI !== text.baseURI) {
					updateImportUrls(text, urlFn)
				}
				text += ""
			}
			return text
		},
		set cssText(text) {
			this.href = text.split(/['"()]+/)[1]
			this.text = clear(text.replace(/url\(("|')(.+?)\1\)/g, "'$2'"))
		}
	},
	"}": {
		get cssText() {
			var body = "" + new CSSStyleSheet({}, this.text)
			return body.length > 0 ? this.mediaText + "{" + body + "}" : ""
		},
		set cssText(text) {
			var idx = text.indexOf("{")
			this.mediaText = clear(text.slice(0, idx).trim())
			this.text = text.slice(idx + 1, -1)
		}
	},
	";": {
		get cssText() {
			return clear(this.text)
		},
		set cssText(text) {
			this.text = clear(text)
		}
	}
}

function CSSRule(text, parentStyleSheet, atType, parentRule = null) {
	// Clear comments and trim
	text = text.trim()
	var type = text[0] === "@" && text.slice(1, text.indexOf(" ")) || "style"
	, rule = Object.create(ruleTypes[type] || ruleTypes[type === "page" || type === "font-face" || type === "counter-style" ? "style" : atType])
	rule.parentStyleSheet = parentStyleSheet
	rule.parentRule = parentRule
	rule.cssText = rule.type === 1 ? text : text.replace(/\/\*(?:[^*]|\*(?!\/))*\*\//g, "")
	return rule
}

function CSSStyleDeclaration(text, parentRule = null) {
	var style = new Proxy({__: {}, parentRule}, styleHandler)
	style.cssText = text
	return style
}

function CSSStyleSheet(opts, text = "") {
	Object.assign(this, opts)
	if (opts && opts.href) {
		this.baseURI = new URL(".", new URL(opts.href, toUrl(
			(opts.parentStyleSheet || opts.ownerNode && opts.ownerNode.ownerDocument).baseURI || ""
		))).pathname.slice(1).replace(/\/$/, "")
	}
	this.replaceSync(text)
}

function updateImportUrls(sheet, urlFn) {
	sheet.rules.forEach(rule => {
		if (rule.type === 1) {
			for (let style = rule.style, val, i = style.length; i--; ) {
				val = style[style[i]]
				if (urlRe.test(val)) style[style[i]] = val.replace(urlRe, urlFn)
			}
		} else if (rule.mediaText != null && rule.text != null) {
			var nested = new CSSStyleSheet({})
			nested.replaceSync(rule.text)
			updateImportUrls(nested, urlFn)
			rule.text = nested.toString()
		}
	})
}

CSSStyleSheet.prototype = {
	baseURI: "",
	root: "",
	disabled: false,
	type: "text/css",
	deleteRule(idx) {
		this.rules.splice(idx, 1)
	},
	insertRule(rule, idx) {
		this.rules.splice(idx > -1 ? idx : this.rules.length, 0, CSSRule(rule, this))
	},
	replaceSync(text) {
		var qpos, sheet = this
		sheet.rules = sheet.cssRules = []
		sheet.warnings = []
		for (var char, inQuote, depth = 0, start = 0, pos = 0, len = text.length; pos < len; pos++) {
			char = text[pos]
			if (char === "\\" && inQuote !== "/") {
				pos++
			} else if (inQuote) {
				if (char === inQuote) {
					if (char !== "/" || text[pos - 1] === "*") {
						if (char === "/" && depth < 1) {
							// Remove root level comments
							text = text.slice(0, qpos) + text.slice(pos + 1)
							pos = qpos - 1
							len = text.length
						}
						inQuote = ""
					}
				}
			} else if (char === "'" || char === "\"" || char === "/" && text[pos+1] === "*") {
				inQuote = char
				qpos = pos
			} else if (char === "{") {
				depth++
			} else if (char === "}" && --depth < 1 || char === ";" && depth < 1) {
				if (depth < 0) throw Error("Unexpected '}'")
				sheet.rules.push(CSSRule(text.slice(start, start = pos + 1), sheet, char))
			}
		}
		if (depth > 0) throw Error("Unclosed block")
	},
	toString(min) {
		if (min) this.min = min
		return this.rules.map(rule => rule.cssText).filter(Boolean).join("\n")
	}
}


