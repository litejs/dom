
/*! litejs.com/MIT-LICENSE.txt */

exports.selectorSplit = selectorSplit
exports.CSSStyleDeclaration = CSSStyleDeclaration
exports.CSSStyleSheet = CSSStyleSheet

var path = require("path")
, clearFn = (_, q, str) => q ? (q = str.indexOf("'") == -1 ? "'" : "\"", q + str.replace(q === "'" ? /\\(")/g : /\\(')/g, "$1")) + q :
	_.replace(/[\t\n]+/g, " ")
	.replace(/ *([,;{}>~+\/]) */g, "$1")
	.replace(/;(?=})/g, "")
	.replace(/: +/g, ":")
	.replace(/([ :,])0\.([0-9])/g, "$1.$2")
, clear = s => s.replace(/("|')((?:\\\1|[^\1])*?)\1|[^"']+/g, clearFn).replace(/url\(("|')([^'"()\s]+)\1\)/g, "url($2)")
, styleHandler = {
	get(style, prop) {
		if (prop === "cssText") {
			for (var out = [], i = style.length; i--; ) {
				out[i] = style[i] + ":" + (style.__[i] || style[style[i]])
			}
			return out.join(";")
		}
		return style[prop] || ""
	},
	set(style, prop, val) {
		if (prop === "cssText") {
			var m, k
			, re = /([*_]?[-a-z]+)\s*:((?:("|')(?:\\.|(?!\3)[^\\])*?\3|[^"';])+)/ig
			, len = 0
			, lastIdx = {}
			for (; (m = re.exec(val)); ) {
				k = m[1]
				if (lastIdx[k] >= 0) style.__[lastIdx[k]] = style[k]
				style[style[lastIdx[k] = len++] = k] = style[
					k === "float" ? "cssFloat" : k.replace(/-([a-z])/g, (_, a) => a.toUpperCase())
				] = clear(m[2]).trim()
			}
			style.length = len
		} else {
			if (!style[prop]) style[style.length++] = prop
			style[prop] = style[prop === "cssFloat" ? "float" : prop.replace(/[A-Z]/g, "-$&").toLowerCase()] = clear(val)
		}
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
			var href
			, sheet = this.parentStyleSheet
			, min = sheet.min
			, text = this.text
			, urlRe = /(["']).*?\1|url\((['"]?)(?!\/|data:|https?:)(.*?)\2\)/g
			, urlFn = (m,q1,q2,u) => q1 ? m : "url('" + path.join(text.baseURI, u) + "')"
			if (min && min.import) {
				href = path.join(sheet.baseURI, this.href)
				text = new CSSStyleSheet({
					parentStyleSheet: sheet,
					href,
					min
				}, require("fs").readFileSync(path.resolve(min.root || "", href), "utf8"))
				if (sheet.baseURI !== text.baseURI) {
					text.rules.forEach(rule => {
						if (rule.type === 1) for (let style = rule.style, i = style.length; i--; ) {
							if (urlRe.test(style[style[i]])) style[style[i]] = style[style[i]].replace(urlRe, urlFn)
						}
					})
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
			var style = new CSSStyleSheet({})
			style.replaceSync(this.text)
			var body = "" + style
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
	text = text.replace(/\/\*(?:[^*]|\*(?!\/))*\*\//g, "").trim()
	var type = text[0] === "@" && text.slice(1, text.indexOf(" ")) || "style"
	, rule = Object.create(ruleTypes[type] || ruleTypes[type === "page" || type === "font-face" || type === "counter-style" ? "style" : atType])
	rule.cssText = text
	rule.parentStyleSheet = parentStyleSheet
	rule.parentRule = parentRule
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
		this.baseURI = path.join(
			(opts.parentStyleSheet || opts.ownerNode && opts.ownerNode.ownerDocument).baseURI || "",
			opts.href,
			".."
		)
	}
	this.replaceSync(text)
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
				if (depth < 0) throw "Invalid css"
				sheet.rules.push(CSSRule(text.slice(start, start = pos + 1), sheet, char))
			}
		}
	},
	toString(min) {
		if (min) this.min = min
		return this.rules.map(rule => rule.cssText).filter(Boolean).join("\n")
	}
}

function selectorSplit(text) {
	for (var char, inQuote, depth = 0, start = 0, pos = 0, len = text.length, out = []; pos < len; ) {
		char = text[pos++]
		if (char === "\\") {
			pos++
		} else if (inQuote) {
			if (char === inQuote) inQuote = ""
		} else if (char === "'" || char === "\"") {
			inQuote = char
		} else if (char === "(" || char === "[") {
			depth++
		} else if (char === ")" || char === "]") {
			depth--
		} else if (char === "," && depth === 0) {
			out.push(text.slice(start, (start = pos) - 1).trim())
		}
	}
	out.push(text.slice(start).trim())
	return out
}


