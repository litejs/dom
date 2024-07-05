
describe("css.js {0}", describe.env === "browser" ? [["mock", exports], ["native", native]] : [["mock", require("../css.js")]], (name, env) => {
	const {
		CSSStyleDeclaration,
	} = env

	describe("{0.name}", [
		[ CSSStyleDeclaration, [
			[ "top:1px", { top: "1px" } ],
			[ "top: 2px", { top: "2px" } ],
			[ "; top  :  3px ;", { top: "3px" } ],
			[ "x: 1; y: 2;", { x: "1", y: "2" } ],
		]],
	], (fn, tests) => {
		test("{0}", tests, (init, expected, assert) => {
			const obj = new fn(init)
			assert
			.own(obj, expected)
			.equal(obj.cssText.replace(/[ ;]/g, ""), init.replace(/[ ;]/g, ""))
			.end()
		})
	})
})

