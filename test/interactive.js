
describe("interactive.js {0}", describe.env === "browser" ?
	[["native", window]] : [["shim", require("../dom.js")]], function(env, DOM) {

	var document = env === "native" ? DOM.document : new DOM.Document

	it("have focus and blur", assert => {
		var el = document.createElement("input")
		document.body.appendChild(el)

		assert.type(el.focus, "function")
		assert.type(el.blur, "function")

		el.focus()
		assert.equal(document.activeElement, el)

		el.blur()
		assert.equal(document.activeElement, document.body)

		document.body.removeChild(el)

		if (env !== "native") {
			var doc = new DOM.Document()
			, body = doc.body
			doc.body = null
			var input = doc.createElement("input")
			input.blur()
			assert.equal(doc.activeElement, null)
			doc.body = body
		}

		assert.end()
	})
})




