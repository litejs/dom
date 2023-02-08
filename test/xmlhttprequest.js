
describe("XMLHttpRequest", function() {
	var XMLHttpRequest = require("../xmlhttprequest.js").XMLHttpRequest

	it("throws on invalid protocol", function(assert) {
		assert.throws(function() {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", "foo://litejs.com")
			xhr.send()
		})
		assert.end()
	})

	it("throws on sync request", function(assert) {
		assert.throws(function() {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", "https://litejs.com", false)
		})
		assert.end()
	})

	it("throws on abort", function(assert) {
		assert.throws(function() {
			var xhr = new XMLHttpRequest()
			xhr.abort()
		})
		assert.end()
	})

	it("throws on reuse", function(assert) {
		assert.throws(function() {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", "https://litejs.com")
			xhr.open("GET", "https://litejs.com")
		})
		assert.end()
	})

	it("make request", function (assert) {
		assert.setTimeout(5000)
		var xhr = new XMLHttpRequest()
		xhr.open("GET", "https://litejs.com")
		xhr.responseType = "document"
		xhr.onload = function() {
			var doc = xhr.responseXML
			assert.equal(doc.documentElement.nodeName, "HTML")
			assert.equal(doc.querySelector("title").textContent, "LiteJS")
			assert.end()
		}
		assert.equal(xhr.responseXML, null)
		xhr.send()
	})

	it("calls onreadystatechange", function (assert, mock) {
		assert.setTimeout(5000)
		var xhr = new XMLHttpRequest()
		xhr.open("GET", "https://litejs.com")
		xhr.onreadystatechange = mock.fn()
		xhr.onload = function() {
			assert.equal(xhr.responseXML, null)
			assert.type(xhr.responseText, "string")
			assert.type(xhr.getAllResponseHeaders(), "string")
			assert.equal(xhr.getResponseHeader("content-type"), "text/html; charset=utf-8")
			assert.end()
		}
		assert.equal(xhr.getAllResponseHeaders(), null)
		assert.equal(xhr.getResponseHeader("content-type"), null)
		xhr.send()
	})
})

