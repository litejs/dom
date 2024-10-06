
/*! litejs.com/MIT-LICENSE.txt */

exports.CSSStyleDeclaration = CSSStyleDeclaration
exports.CSSStyleSheet = CSSStyleSheet

var clearFn = (_, q, str) => q ? (q == "\"" && str.indexOf("'") == -1 ? "'" + str + "'" : _) :
	_.trim().replace(/[\t\n]/g, " ")
	.replace(/ *([,;{}>~+\/]) */g, "$1")
	.replace(/^ +|;(?=})/g, "")
	.replace(/: +/g, ":")
, clear = s => s.replace(/(["'])((?:\\\1|.)*?)\1|[^"']+/g, clearFn).replace(/url\(("|')([^'"()\s]+)\1\)/g, "url($2)")
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
			, re = /(?:^|;)\s*([-a-z]+)\s*:((?:("|')(?:\\.|(?!\3)[^\\])*?\3|[^"';])+)(?=;|$)/ig
			, len = 0
			, lastIdx = {}
			for (; (m = re.exec(val)); ) {
				k = m[1]
				if (lastIdx[k] >= 0) style.__[lastIdx[k]] = style[k]
				style[style[lastIdx[k] = len++] = k] = style[
					k === "float" ? "cssFloat" : k.replace(/-([a-z])/g, (_, a) => a.toUpperCase())
				] = clear(m[2])
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
		get cssText() {
			return this.style.length > 0 ? this.selectorText + "{" + this.style.cssText + "}" : ""
		},
		set cssText(text) {
			var idx = text.indexOf("{")
			this.selectorText = text.slice(0, idx).trim()
			this.style = CSSStyleDeclaration(text.slice(idx + 1).replace(/}\s*/, ""), this)
		}
	},
	import: {
		get cssText() {
			return clear(this.text)
		},
		set cssText(text) {
			this.text = clear(text)
		}
	},
	"}": {
		get cssText() {
			var body = "" + this.style
			return body.length > 0 ? this.mediaText + "{\n" + body + "\n}" : ""
		},
		set cssText(text) {
			var idx = text.indexOf("{")
			this.mediaText = clear(text.slice(0, idx).trim())
			this.style = new CSSStyleSheet({})
			this.style.replaceSync(text.slice(idx + 1, -1))
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
	text = text.replace(/^\s+|\/\*[^*]*\*+([^/*][^*]*\*+)*\/|\s+$/g, "")
	var type = text[0] === "@" && text.slice(1, text.indexOf(" ")) || "style"
	, rule = Object.create(ruleTypes[type] || ruleTypes[type === "font-face" || type === "counter-style" ? "style" : atType])
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

function CSSStyleSheet(opts) {
	Object.assign(this, opts)
	this.replaceSync(this.el ? this.el.textContent : "")
}

CSSStyleSheet.prototype = {
	disabled: false,
	type: "text/css",
	deleteRule(idx) {
		this.rules.splice(idx, 1)
	},
	insertRule(rule, idx) {
		this.rules.splice(idx > -1 ? idx : this.rules.length, 0, CSSRule(rule, this))
	},
	replaceSync(text) {
		var m
		, sheet = this
		, re = /((?:("|')(?:\\.|(?!\2)[^\\])*?\2|[^"'}{;])+)|./ig
		, block = 0
		, pos = 0
		sheet.rules = sheet.cssRules = []
		sheet.warnings = []
		for (; (m = re.exec(text)); ) {
			if (m[0] === "{") {
				block++
			} else if (m[0] === ";" && block === 0 || m[0] === "}" && --block < 1) {
				sheet.rules.push(CSSRule(text.slice(pos, pos = re.lastIndex), sheet, m[0]))
			}
		}
	},
	toString() {
		return this.rules.map(rule => rule.cssText).filter(Boolean).join("\n")
	}
}


