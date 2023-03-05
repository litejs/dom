

/*! litejs.com/MIT-LICENSE.txt */


var DOM = module.exports = require(".")
, HTMLElementExtra = {
	focus: function() {
		this.ownerDocument.activeElement = this
	},
	blur: function() {
		this.ownerDocument.activeElement = null
	}
}

Object.assign(DOM.HTMLElement.prototype, HTMLElementExtra)


