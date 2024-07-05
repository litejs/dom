
describe("css.js", () => {
	const {
		CSSStyleDeclaration,
	} = require("../css.js")

	describe("{0.name}", [
		[ CSSStyleDeclaration, [
			[ "top: 1px", { top: "1px" } ],
		]],
	], (fn, tests) => {
		test("{0}", tests, (init, expected, assert) => assert.equal(new fn(init), expected).end())
	})
})

