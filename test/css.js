
// CSS Declaration - CSS property and value pair not exposed in DOM.
// CSSStyleDeclaration is a single CSS declaration block,
// accessible via HTMLElement.style for inline styles, document.styleSheets[0].cssRules[0].style, and getComputedStyle()
//


describe("css.js {0}", describe.env === "browser" ?
	[["native", window]] : [["shim", require("../dom.js")]], function(env, DOM) {
	var CSSStyleSheet = DOM.CSSStyleSheet
	, CSSStyleDeclaration = env === "native" ? native.CSSStyleDeclaration : DOM.CSSStyleDeclaration
	, minify = require("../css.js").CSS.minify

	describe("CSSStyleDeclaration", () => {
		test("{0}", [
			[ "top:1px", { top: "1px" } ],
			[ "top: 2px", { top: "2px" } ],
			[ "; top  :  3px ;", { top: "3px" } ],
		], (init, expected, assert) => {
			const obj = CSSStyleDeclaration(init)
			const re = /^[; ]+| |[; ]+$/g
			for (var key in expected) assert.equal(obj[key], expected[key])
			assert.equal(obj.cssText.replace(re, ""), init.replace(re, ""))
			assert.end()
		})

		if (env !== "native") test("{0}", [
			[ "margin-top: 12em ; padding-top: none", { marginTop: "12em", paddingTop: "none" } ],
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
		var sheet = new CSSStyleSheet()
		test("constructor", assert => {
			sheet.insertRule(".btn { padding-top: 10px; }")
			assert.equal(sheet.rules.length, 1)
			assert.equal(sheet.rules[0].selectorText, ".btn")
			assert.equal(sheet.rules[0].style["paddingTop"], "10px")
			assert.equal(sheet.rules[0].style["padding-top"], "10px")
			assert.ok("0" in sheet.rules[0].style)
			sheet.insertRule("body { background: blue; }", 0)
			assert.equal(sheet.rules.length, 2)
			assert.equal(minify(sheet), "body{background:blue}\n.btn{padding-top:10px}")
			sheet.deleteRule(0)
			assert.equal(sheet.rules.length, 1)
			assert.equal(minify(sheet), ".btn{padding-top:10px}")
			assert.end()
		})

		test("parse {i} '{0}'", [
			[" ", "", 0],
			[" html {} body{  } ", "", ["html", "body"]],
			["/*comment*/body{color:red}/**/p{font-size:12px}", "body{color:red}\np{font-size:12px}", ["body", "p"]],
			[" body { font-size: 1.4em; } p { color: red; }", "body{font-size:1.4em}\np{color:red}", ["body", "p"]],
			["@media (min-width: 500px) {\n  body {\n    color: blue;\n  }\n}\n", "@media (min-width:500px){body{color:blue}}", 1],
			["@media (min-width: 500px) {\n\n}\n", "", 1],
			["@font-face { font-family: MyFont; src: url(font.woff); }", "@font-face{font-family:MyFont;src:url(font.woff)}", 1],
			[".a{color:red/* green */}", ".a{color:red}", 1],
		], (text, expected, rules, assert) => {
			sheet.replaceSync(text)
			assert.equal(minify(sheet), expected)
			if (Array.isArray(rules)) {
				assert.equal(sheet.rules.length, rules.length)
				for (var i = 0; i < rules.length; i++) assert.equal(sheet.rules[i].selectorText, rules[i])
			} else {
				assert.equal(sheet.rules.length, rules)
			}
			assert.end()
		})

		test("color {i} '{1}'", [
			[ { color: true }, ".a{color:rgb(255,0,153)}.b{color:rgb(0,1,2)}", ".a{color:#f09}\n.b{color:#000102}"],
			[ { color: true }, ".a{color:hsl(0 0% 0%)}", ".a{color:#000}"],
			[ { color: true }, ".a{color:hsl(0 0% 100%)}", ".a{color:#fff}"],
			[ { color: true }, ".a{color:hsl(0deg 100% 100%)}", ".a{color:#fff}"],
			[ { color: true }, ".a{color:hsl(30 10% 90%)}", ".a{color:#e8e6e3}"],
			[ { color: true }, ".a{color:hsl(60,20%,80%)}", ".a{color:#d6d6c2}"],
			[ { color: true }, ".a{color:hsla(90,30%,70%)}", ".a{color:#b3c99c}"],
			[ { color: true }, ".a{color:hsla(90 30% 70% / 1)}", ".a{color:#b3c99c}"],
			[ { color: true }, ".a{color:hsla(90 30% 70% / 100%)}", ".a{color:#b3c99c}"],
			[ { color: true }, ".a{color:hsla(90 30% 70% / 0.5)}", ".a{color:rgba(179,201,156,.5)}"],
			[ { color: true }, ".a{color:hsla(90, 30%, 70%, 50%)}", ".a{color:rgba(179,201,156,.5)}"],
			[ { color: true }, ".a{color:hsl(120 40% 60%)}", ".a{color:#70c270}"],
		], (min, text, expected, assert) => {
			const sheet = new CSSStyleSheet()
			sheet.replaceSync(text)
			assert.equal(minify(sheet, min), expected).end()
		})

		if (env !== "native") test("toString with color", assert => {
			var s = new CSSStyleSheet()
			s.replaceSync(".a{color:rgb(255,0,153)}")
			assert
			.equal(minify(s, { color: true }), ".a{color:#f09}")
			.equal(minify({ cssRules: s.rules }, { color: true }), ".a{color:#f09}")
			.equal(minify({ rules: s.rules }, { color: true }), ".a{color:#f09}")
			.end()
		})

		if (env !== "native") {
			test("minify '{0}'", [
				["a{a:1}b{b:2}c{c:3}", "a{a:1}\nb{b:2}\nc{c:3}"],
				["/*A*/a/*B\\*/{b:c}/**/d/**/{e:f}", "a{b:c}\nd{e:f}"],
				["a\\,b{c:d}", "a\\,b{c:d}"],
				[" * {margin:0} body { font-size: 1.4em; } p { color: red; }", "*{margin:0}\nbody{font-size:1.4em}\np{color:red}"],
				["div {\n background: #00a400;\n background: linear-gradient(to bottom, rgb(214, 122, 127) 0%, hsla(237deg 74% 33% / 61%) 100%);}", "div{background:#00a400;background:linear-gradient(to bottom,rgb(214,122,127) 0%,hsla(237deg 74% 33%/61%) 100%)}"],
				[" @import url('a.css') screen;  @import url(\"b.css\") screen; * { margin: 0; }", "@import 'a.css' screen;\n@import 'b.css' screen;\n*{margin:0}"],
				[".a { b: url('a\\'b') }", ".a{b:url(\"a'b\")}"],
				], (text, expected, assert) => {
				sheet.replaceSync(text)
				assert.equal(minify(sheet), expected).end()
			})

			test("var {i} '{1}'", [
				[ { var: true }, ":root{--a:123px}.p{width:var(--a)}", ".p{width:123px}" ],
				[ { var: true }, ":root{--a:red}.p{color:var(--a);top:1px}", ".p{color:red;top:1px}" ],
				[ { var: true }, ":root{--a:1px;--b:2px}.p{top:var(--a);left:var(--b)}", ".p{top:1px;left:2px}" ],
				[ { var: true }, ".p{width:var(--a,5px)}", ".p{width:5px}" ],
				[ { var: true }, ":root{--a:1px}.p{width:var(--a,5px)}", ".p{width:1px}" ],
				[ { var: true }, ":root{--a:1px;--b:var(--a)}.p{width:var(--b)}", ".p{width:1px}" ],
				[ { var: true }, ":root{--a:red}:root{--b:blue}.p{color:var(--a);bg:var(--b)}", ".p{color:red;bg:blue}" ],
				[ { var: true }, ":root{--a:1px}.p{border:var(--a) solid red}", ".p{border:1px solid red}" ],
				[ { var: true }, ".p{width:var(--a)}", ".p{width:var(--a)}" ],
				[ { var: true }, ":root{--b:var(--x)}.p{width:var(--b)}", ".p{width:var(--x)}" ],
			], (opts, text, expected, assert) => {
				sheet.replaceSync(text)
				assert.equal(minify(sheet, opts), expected).end()
			})

			test("url callback", assert => {
				var map = { "img/icon.png": "icon_abc.png", "bg.jpg": "bg_123.jpg" }
				sheet.replaceSync(".a{background:url(img/icon.png)}.b{background:url(bg.jpg)}.c{color:red}")
				assert.equal(
					minify(sheet, { url: function(path) { return map[path] || path } }),
					".a{background:url(icon_abc.png)}\n.b{background:url(bg_123.jpg)}\n.c{color:red}"
				)
				sheet.replaceSync(".a{background:url(https://cdn.example.com/x.png) url(keep.png)}")
				assert.equal(
					minify(sheet, { url: function() { return "replaced.png" } }),
					".a{background:url(https://cdn.example.com/x.png) url(replaced.png)}"
				)
				sheet.replaceSync('.a{content:"url(skip.png)";background:url(real.png)}')
				assert.equal(
					minify(sheet, { url: function() { return "mapped.png" } }),
					".a{content:'url(skip.png)';background:url(mapped.png)}"
				)
				assert.end()
			})

			test("@charset", assert => {
				sheet.replaceSync("@charset \"utf-8\"; body{color:red}")
				assert
				.equal(sheet.rules.length, 2)
				.equal(minify(sheet), "@charset 'utf-8';\nbody{color:red}")
				.end()
			})

			test("data-uri {i}", [
				[
					".a{background:url(test/data/ui/css/tiny.gif);/*! data-uri */}",
					".a{background:url(data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=)}"
				],
				[
					".a{background:\"keep\" url(test/data/ui/css/tiny.gif);/*! data-uri */}",
					".a{background:'keep' url(data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=)}"
				],
				[
					".a{background:url(test/data/ui/css/ul.svg);/*! data-uri */}",
					".a{background:url('data:image/svg+xml;,<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"600\" width=\"900\" viewBox=\"-300 -200 900 600\" fill=\"%2300a651\"><path d=\"M14 340a2.2 2.2 0 1 1 0 .1zm9 20a5.2 5.2 0 1 1 0 .1z\"/><g id=\"circle-1\"><circle cx=\"4\" cy=\"4\" r=\"1\"/><circle cx=\"5\" cy=\"5\" r=\"1\"/></g><circle id=\"circle-2\" cx=\"5\" cy=\"5\" r=\"2\"/></svg>')}"
				],
				[
					".a{background:url(test/data/ui/css/ul.svg#circle-1);/*! data-uri */}",
					".a{background:url('data:image/svg+xml;,<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"600\" width=\"900\" viewBox=\"-300 -200 900 600\" fill=\"%2300a651\"><circle cx=\"4\" cy=\"4\" r=\"1\"/><circle cx=\"5\" cy=\"5\" r=\"1\"/></svg>')}"
				],
				[
					".a{background:url(test/data/ui/css/ul.svg#circle-2);/*! data-uri */}",
					".a{background:url('data:image/svg+xml;,<svg xmlns=\"http://www.w3.org/2000/svg\" height=\"600\" width=\"900\" viewBox=\"-300 -200 900 600\" fill=\"%2300a651\"><circle cx=\"5\" cy=\"5\" r=\"2\"/></svg>')}"
				],
			], (source, result, assert) => {
				var s = new CSSStyleSheet()
				s.replaceSync(source)
				assert.equal(minify(s), result).end()
			})

			test("@import", [
				[ null, "@import 'css/c.css';", "@import 'css/c.css';" ],
				[ null, "@import 'css/c.css';", "@import 'css/c.css';" ],
				[ null, "@import 'css/c.css';", "@import 'css/c.css';" ],
				[ { import: true },
					"@import 'test/data/ui/css/c.css';",
					".c{content:'url(my-icon.jpg)';cursor:url(test/data/ui/css/my-icon.jpg);background:url(/static/star.gif) bottom right repeat-x blue;mask-image:image(url(https://example.com/images/mask.png),skyblue,linear-gradient(rgb(0 0 0/100%),transparent))}"
				],
				[ { import: true },
					"@import 'test/data/ui/css/import-nested.css';",
					".nested{color:green}\n@media (min-width:1px){.hero{background:url(test/data/ui/css/media.png)}}\n@keyframes spin{from{background-image:url(test/data/ui/css/frames/start.png)}}"
				],
				[ { import: true, root: "test/data/ui" },
					"@import 'css/c.css';",
					".c{content:'url(my-icon.jpg)';cursor:url(css/my-icon.jpg);background:url(/static/star.gif) bottom right repeat-x blue;mask-image:image(url(https://example.com/images/mask.png),skyblue,linear-gradient(rgb(0 0 0/100%),transparent))}"
				],
				[ { import: true, root: "test/data/ui/css" }, "@import 'c.css';",
					".c{content:'url(my-icon.jpg)';cursor:url(my-icon.jpg);background:url(/static/star.gif) bottom right repeat-x blue;mask-image:image(url(https://example.com/images/mask.png),skyblue,linear-gradient(rgb(0 0 0/100%),transparent))}"
				],
			], (opts, source, result, assert) => {
				const sheet = new CSSStyleSheet()
				sheet.replaceSync(source)
				if (opts) {
					assert.equal(minify(sheet, opts), result)
				} else {
					assert.equal(sheet.toString(), result)
				}
				assert.end()
			})
		}
	})

	if (env !== "native") test("lint", [
		[ "a{b:1;}}" ],
		[ "a{b:1;" ],
	], (css, assert) => {
		assert.throws(() => new CSSStyleSheet().replaceSync(css)).end()
	})

	//require("@litejs/cli/snapshot")
	//test("parse and stringify", [
	//	[ null ],
	//	[ true ],
	//	[ { import: true } ],
	//], (min, assert) => {
	//	assert.matchSnapshot("./test/data/ui/css/samp1.css", str => {
	//		const sheet = new CSSStyleSheet({ min, baseURI: "test/data/ui/css" }, str)
	//		return sheet.toString()
	//	})
	//	assert.end()
	//})

})
