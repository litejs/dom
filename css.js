
/*! litejs.com/MIT-LICENSE.txt */

exports.CSSStyleDeclaration = CSSStyleDeclaration

function CSSStyleDeclaration(style) {
	this.cssText = style
}

CSSStyleDeclaration.prototype = {
	get cssText() {
		return Object.keys(this).map(
			key => (key === "cssFloat" ? "float:" : hyphenCase(key) + ":") + this[key]
		).join(";")
	},
	set cssText(style) {
		for (var m, re = /(?:^|;)\s*([-a-z]+)\s*:((?:("|')(?:\\.|(?!\3)[^\\])*?\3|[^"';])+)(?=;|$)/ig; (m = re.exec(style)); ) {
			this[m[1] === "float" ? "cssFloat" : camelCase(m[1])] = m[2].trim()
		}
	}
}

function camelCase(str) {
	return str.replace(/-([a-z])/g, function(_, a) { return a.toUpperCase() })
}

function hyphenCase(str) {
	return str.replace(/[A-Z]/g, "-$&").toLowerCase()
}

