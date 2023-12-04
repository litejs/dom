
describe("CSS", function() {
	var css = require("../css.js")
	, CSSStyleSheet = css.CSSStyleSheet

	it ("should create CSSStyleSheet", function(assert) {
		var stylesheet = new CSSStyleSheet({ disabled: true, media: "print" })
		assert.equal(stylesheet.disabled, true)
		assert.equal(stylesheet.media, "print")
		assert.end()
	})

	it ("can insertRule/replace/deleteRule CSSStyleSheet", function(assert) {
		var stylesheet = new CSSStyleSheet()
		stylesheet.insertRule("#blanc { color: white }")
		assert.equal(stylesheet.cssRules.length, 1)
		assert.equal(stylesheet.cssRules[0].selectorText, "#blanc")
		assert.equal(stylesheet.cssRules[0].style.color, "white")

		stylesheet.replace("body { font-size: 1.4em; } p { color: red; }")
		.then(() => {
			assert.equal(stylesheet.cssRules.length, 2)
			assert.equal(stylesheet.cssRules[0].cssText, "body{font-size:1.4em}")
			assert.equal(stylesheet.cssRules[1].cssText, "p{color:red}")
			stylesheet.deleteRule(0)
			assert.equal(stylesheet.cssRules.length, 1)
			assert.equal(stylesheet.cssRules[0].cssText, "p{color:red}")
			assert.end()
		})
	})
})
