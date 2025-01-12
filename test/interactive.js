

describe("Interactive DOM", () => {
	var undef
	,  { document } = require("..")

	it("have focus and blur", assert => {
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




