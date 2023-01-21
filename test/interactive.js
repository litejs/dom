

describe("Interactive DOM", function() {
	var undef
	, DOM = require("../interactive")
	, document = DOM.document
	, it = describe.it

	it("have focus and blur", function (assert) {
		var el = document.createElement("h1")

		assert.type(el.focus, "function")
		assert.type(el.blur, "function")

		el.focus()
		assert.equal(document.activeElement, el)

		el.blur()
		assert.equal(document.activeElement, null)

		assert.end()
	})
})




