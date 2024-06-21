
import DOM from "../dom.js"

describe("Run as ESM module", () => {
	it("should export function", assert => {
		assert.type(DOM.DOMParser, "function")
		assert.end()
	})
})

