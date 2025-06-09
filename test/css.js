
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

	describe("CSSStyleDeclaration", () => {
		test("{0}", [
			[ "top:1px", { top: "1px" } ],
			[ "margin-top: 12em ; padding-top: none", { marginTop: "12em", paddingTop: "none" } ],
			[ "top: 2px", { top: "2px" } ],
			[ "; top  :  3px ;", { top: "3px" } ],
			[ "x: 1; y: 2;", { x: "1", y: "2" } ],
		], (init, expected, assert) => {
			const obj = CSSStyleDeclaration(init)
			const re = /^[; ]+| |[; ]+$/g
			assert
			.own(obj, expected)
			.equal(obj.cssText.replace(re, ""), init.replace(re, ""))
			.end()
		})
	})

	describe("CSSStyleSheet", () => {
		const sheet = new CSSStyleSheet()
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

		test("color {i} '{1}'", [
			[ ".a{color:rgb(255 0 153)}.b{color:rgb( 0 1 2 )}", ".a{color:rgb(255 0 153)}\n.b{color:rgb( 0 1 2 )}"],
		], (text, expected, assert) => {
			const sheet = new CSSStyleSheet()
			sheet.replaceSync(text)
			assert.equal(sheet.toString(true), expected).end()
		})

		test("color {i} '{1}'", [
			[ { color: true }, ".a{color:rgb(255,0,153)}.b{color:rgb( 0 1 2 )}", ".a{color:#f09}\n.b{color:#000102}"],
			[ { color: true }, ".a{color:hsl(0 0% 0%)}", ".a{color:#000}"],
			[ { color: true }, ".a{color:hsl(0 0% 100%)}", ".a{color:#fff}"],
			[ { color: true }, ".a{color:hsl(0deg 100% 100%)}", ".a{color:#fff}"],
			[ { color: true }, ".a{color:hsl(30 10 90)}", ".a{color:#e8e6e3}"],
			[ { color: true }, ".a{color:hsl(60,20%,80%)}", ".a{color:#d6d6c2}"],
			[ { color: true }, ".a{color:hsla(90,30,70)}", ".a{color:#b3c99c}"],
			[ { color: true }, ".a{color:hsla(90 30 70 / 1)}", ".a{color:#b3c99c}"],
			[ { color: true }, ".a{color:hsla(90 30 70 100%)}", ".a{color:#b3c99c}"],
			[ { color: true }, ".a{color:hsla(90 30 70 / 0.5)}", ".a{color:rgba(179,201,156,.5)}"],
			[ { color: true }, ".a{color:hsla(90, 30%, 70%, 50%)}", ".a{color:rgba(179,201,156,.5)}"],
			[ { color: true }, ".a{color:hsl(120 40% 60%)}", ".a{color:#70c270}"],
		], (min, text, expected, assert) => {
			const sheet = new CSSStyleSheet({ min })
			sheet.replaceSync(text)
			assert.equal(sheet.toString(), expected).end()
		})

		test("parse '{0}'", [
			[" ", ""],
			[" html {} body{  } ", ""],
			["a{a:1}b{b:2}c{c:3}", "a{a:1}\nb{b:2}\nc{c:3}"],
			["/*A*/a/*B\\*/{b:c}/**/d/**/{e:f}", "a{b:c}\nd{e:f}"],
			["a\\,b{c:d}", "a\\,b{c:d}"],
			[" * {margin:0} body { font-size: 1.4em; } p { color: red; }", "*{margin:0}\nbody{font-size:1.4em}\np{color:red}"],
			["div {\n background: #00a400;\n background: linear-gradient(to bottom, rgb(214, 122, 127) 0%, hsla(237deg 74% 33% / 61%) 100%);}", "div{background:#00a400;background:linear-gradient(to bottom,rgb(214,122,127) 0%,hsla(237deg 74% 33%/61%) 100%)}"],
			[" @import url('a.css') screen;  @import url(\"b.css\") screen; * { margin: 0; }", "@import 'a.css' screen;\n@import 'b.css' screen;\n*{margin:0}"],
			["@media (min-width: 500px) {\n  body {\n    color: blue;\n  }\n}\n", "@media (min-width:500px){body{color:blue}}"],
			["@media (min-width: 500px) {\n\n}\n", ""],
			[".a { b: url('a\\'b') }", ".a{b:url(\"a'b\")}"],
			//[":root{--my-test-variable:123px}.p{ width: var(--my-test-variable); }", ".p{width:123px}"],
		], (text, expected, assert) => {
			sheet.replaceSync(text)
			assert.equal(sheet.toString(), expected).end()
		})

		test("@import", [
			[ null, "@import 'css/c.css';", "@import 'css/c.css';" ],
			[ {}, "@import 'css/c.css';", "@import 'css/c.css';" ],
			[ { min: true }, "@import 'css/c.css';", "@import 'css/c.css';" ],
			[ { min: { import: true } },
				"@import 'test/data/ui/css/c.css';",
				".c{content:'url(my-icon.jpg)';cursor:url(test/data/ui/css/my-icon.jpg);background:url(/static/star.gif) bottom right repeat-x blue;mask-image:image(url(https://example.com/images/mask.png),skyblue,linear-gradient(rgb(0 0 0/100%),transparent))}"
			],
			[ { min: { import: true, root: "test/data/ui" } },
				"@import 'css/c.css';",
				".c{content:'url(my-icon.jpg)';cursor:url(css/my-icon.jpg);background:url(/static/star.gif) bottom right repeat-x blue;mask-image:image(url(https://example.com/images/mask.png),skyblue,linear-gradient(rgb(0 0 0/100%),transparent))}"
			],
			[ { min: { import: true, root: "test/data/ui/css" } }, "@import 'c.css';",
				".c{content:'url(my-icon.jpg)';cursor:url(my-icon.jpg);background:url(/static/star.gif) bottom right repeat-x blue;mask-image:image(url(https://example.com/images/mask.png),skyblue,linear-gradient(rgb(0 0 0/100%),transparent))}"
			],

		], (opts, source, result, assert) => {
			const sheet = new CSSStyleSheet(opts)
			sheet.replaceSync(source)
			assert.equal(sheet.toString(), result)
			assert.end()
		})
	})

	test("lint", [
		[ "a{b:1;}}" ],
		[ "a{b:1;" ],
	], (css, assert) => {
		assert.throws(() => new CSSStyleSheet().replaceSync(css)).end()
	})

	test("parse and stringify", [
		[ null ],
		[ true ],
		[ { import: true } ],
	], (min, assert) => {
		assert.matchSnapshot("./test/data/ui/css/samp1.css", str => {
			const sheet = new CSSStyleSheet({ min, baseURI: "test/data/ui/css" }, str)
			return sheet.toString()
		})
		assert.end()
	})

})

