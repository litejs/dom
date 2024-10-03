

/*! litejs.com/MIT-LICENSE.txt */


var DOM = module.exports = require(".")
, HTMLElementExtra = {
	focus() {
		this.ownerDocument.activeElement = this
	},
	blur() {
		this.ownerDocument.activeElement = null
	}
}

Object.assign(DOM.HTMLElement.prototype, HTMLElementExtra)


