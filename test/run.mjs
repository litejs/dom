
import { document } from "../dom.js"

describe("Run as ESM module", () => {
	it("should have function document.createElement", assert => {
		assert.type(document.createElement, "function")
		assert.end()
	})
})

