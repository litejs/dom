
// CSS Declaration - CSS property and value pair not exposed in DOM.
// CSSStyleDeclaration is a single CSS declaration block,
// accessible via HTMLElement.style for inline styles, document.styleSheets[0].cssRules[0].style, and getComputedStyle()
//


describe("css.js {0}", describe.env === "browser" ? [["mock", exports], ["native", native]] : [["mock", require("../css.js")]], (name, env) => {
	require("@litejs/cli/snapshot")
	const {
		CSSStyleSheet,
		CSSStyleDeclaration,
	} = env

	describe("{0.name}", [
		[ CSSStyleDeclaration, [
			[ "top:1px", { top: "1px" } ],
			[ "margin-top: 12em ; padding-top: none", { marginTop: "12em", paddingTop: "none" } ],
			[ "top: 2px", { top: "2px" } ],
			[ "; top  :  3px ;", { top: "3px" } ],
			[ "x: 1; y: 2;", { x: "1", y: "2" } ],
		]],
	], (fn, tests) => {
		test("{0}", tests, (init, expected, assert) => {
			const obj = fn(init)
			assert
			.own(obj, expected)
			.equal(obj.cssText.replace(/[ ;]/g, ""), init.replace(/[ ;]/g, ""))
			.end()
		})
	})

	describe("CSSStyleSheet", () => {
		const sheet = new CSSStyleSheet
		test("constructor", assert => {
			sheet.insertRule(".btn { padding-top: 10px; }")
			assert.equal(sheet.rules.length, 1)
			assert.equal(sheet.rules[0].selectorText, ".btn")
			assert.equal(sheet.rules[0].style["paddingTop"], "10px")
			assert.equal(sheet.rules[0].style["padding-top"], "10px")
			assert.ok("0" in sheet.rules[0].style)
			assert.ok(sheet.rules[0].style.hasOwnProperty("0"))
			assert.ok(sheet.rules[0].style.hasOwnProperty("0"))
			sheet.insertRule("body { background: blue; }", 0)
			assert.equal(sheet.rules.length, 2)
			assert.equal(sheet.toString(), "body{background:blue}\n.btn{padding-top:10px}")
			sheet.deleteRule(0)
			assert.equal(sheet.toString(), ".btn{padding-top:10px}")
			assert.end()
		})

		test("parse {i}", [
			[" ", ""],
			[" html {} body{  } ", ""],
			[" * {margin:0} body { font-size: 1.4em; } p { color: red; }", "*{margin:0}\nbody{font-size:1.4em}\np{color:red}"],
			["div {\n background: #00a400;\n background: linear-gradient(to bottom, rgb(214, 122, 127) 0%, hsla(237deg 74% 33% / 61%) 100%);}", "div{background:#00a400;background:linear-gradient(to bottom,rgb(214,122,127) 0%,hsla(237deg 74% 33%/61%) 100%)}"],
			[" @import url('a.css') screen;  @import url(\"b.css\") screen; * { margin: 0; }", "@import 'a.css' screen;\n@import 'b.css' screen;\n*{margin:0}"],
			["@media (min-width: 500px) {\n  body {\n    color: blue;\n  }\n}\n", "@media (min-width:500px){\nbody{color:blue}\n}"],
			["@media (min-width: 500px) {\n\n}\n", ""],
			//[":root{--my-test-variable:123px}.p{ width: var(--my-test-variable); }", ".p{width:123px}"],
		], (text, expected, assert) => {
			sheet.replaceSync(text)
			assert.equal(sheet.toString(), expected).end()
		})
	})

	test("parse and stringify", assert => {
		assert.matchSnapshot("./test/data/ui/css/samp1.css", str => {
			const sheet = new CSSStyleSheet
			sheet.replaceSync(str)
			return sheet.toString()
		})
		assert.end()
	})
})

