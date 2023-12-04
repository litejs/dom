
describe("CSS", function() {
	var css = require("../css.js")
	, CSSStyleSheet = css.CSSStyleSheet

	it ("should create CSSStyleSheet", function(assert) {
		var stylesheet = new CSSStyleSheet({ disabled: true })
		assert.equal(stylesheet.disabled, true)
		assert.end()
	})
	it ("can insertRule", function(assert) {
		var stylesheet = new CSSStyleSheet()
		stylesheet.insertRule("#blanc { color: white }", 0)
		assert.equal(stylesheet.cssRules.length, 1)
		assert.equal(stylesheet.cssRules[0].selectorText, "#blanc")
		assert.equal(stylesheet.cssRules[0].style.color, "white")
		assert.end()
	})

	it ("can replace CSSStyleSheet", function(assert) {
		var stylesheet = new CSSStyleSheet()
		stylesheet.insertRule("#blanc { color: white }")

		stylesheet.replace("body { font-size: 1.4em; } p { color: red; }")
		.then(() => {
			assert.equal(stylesheet.cssRules[0].cssText, "body{font-size:1.4em}")
			assert.end()
		})
	})
})
