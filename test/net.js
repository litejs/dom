
describe("XMLHttpRequest", function() {
	var XMLHttpRequest = require("../net.js").XMLHttpRequest

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
			assert.equal(xhr.status, 200)
			assert.equal(xhr.statusText, "OK")
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

	describe("Data URLs", function() {
		var table = [
			[ "data:,Hello%2C%20World%21", "text/plain", "Hello, World!" ],
			[ "data:text/html,%3Ch1%3EHello%2C%20World%21%3C%2Fh1%3E", "text/html", "<h1>Hello, World!</h1>" ],
			[ "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==", "text/plain", "Hello, World!" ],
			[ "data:text/javascript,console.log('a')", "text/javascript", "console.log('a')" ]
		]

		it("throws on invalid Data URL", function(assert) {
			assert.throws(function() {
				var xhr = new XMLHttpRequest()
				xhr.open("GET", "data:Hello")
				xhr.send()
			})
			assert.end()
		})

		table.forEach(function(data, i) {
			it("handles data " + i, function(assert) {
				var xhr = new XMLHttpRequest()
				xhr.open("GET", data[0])
				xhr.onload = function() {
					assert.equal(xhr.getResponseHeader("content-type"), data[1])
					assert.equal(xhr.responseText, data[2])
					assert.end()
				}
				xhr.send()
			})
		})
	})
})

