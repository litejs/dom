
/*! litejs.com/MIT-LICENSE.txt */

/* global Promise */

var CSSStyleDeclaration = require("./dom.js").CSSStyleDeclaration

exports.CSSStyleSheet = CSSStyleSheet

function CSSStyleSheet(opts) {
	var sheet = Object.assign(this, opts)
	sheet.cssRules = []
	//sheet.media = new MediaList(opts.media || "")
}

CSSStyleSheet.prototype = {
	disabled: false,
	ownerRule: null,
	deleteRule: function(index) {
		this.cssRules.splice(index, 1)
	},
	insertRule: function(rule, index) {
		this.cssRules.splice(index >= 0 ? index : this.cssRules.length, 0, new CSSStyleRule(rule))
	},
	replaceSync: function(text) {
		var sheet = this
		sheet.cssRules = []
		text.split("}").forEach(function(rule) {
			if (rule) sheet.insertRule(rule)
		})
	},
	replace: function(text) {
		this.replaceSync(text)
		return Promise.resolve(this)
	}
}

// CSSConditionRule: CSSMediaRule, CSSContainerRule, CSSSupportsRule
function CSSStyleRule(rule) {
	var junks = rule.split(/[{}]/)
	this.selectorText = junks[0].trim()
	this.style = new CSSStyleDeclaration(junks[1].trim())
}

CSSStyleRule.prototype = {
	get cssText() {
		return this.selectorText + "{" + this.style.cssText + "}"
	}
}

