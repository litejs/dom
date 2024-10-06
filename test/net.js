
describe("XMLHttpRequest", () => {
	var { XMLHttpRequest, protocolHandler } = require("../net.js")

	it("throws", assert => {
		assert.throws(() => {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", "foo://litejs.com")
			xhr.send()
		}, "on invalid protocol")

		assert.throws(() => {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", "https://litejs.com", false)
			xhr.send()
		}, "on sync request")

		assert.throws(() => {
			var xhr = new XMLHttpRequest()
			xhr.abort()
		}, "on abort")

		assert.throws(() => {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", "https://litejs.com")
			xhr.open("GET", "https://litejs.com")
		}, "on reuse")
		assert.end()
	})

	it("make request", assert => {
		assert.setTimeout(5000)
		var xhr = new XMLHttpRequest()
		xhr.setRequestHeader("Accept", "text/html")
		xhr.open("GET", "https://litejs.com")
		xhr.responseType = "document"
		xhr.onload = () => {
			var doc = xhr.responseXML
			assert.equal(doc.documentElement.nodeName, "HTML")
			assert.equal(doc.querySelector("title").textContent, "LiteJS")
			assert.end()
		}
		assert.equal(xhr.responseXML, null)
		xhr.send()
	})

	it("calls onreadystatechange", (assert, mock) => {
		assert.setTimeout(5000)
		var xhr = new XMLHttpRequest()
		xhr.open("GET", "https://litejs.com")
		xhr.onreadystatechange = mock.fn()
		xhr.onload = () => {
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

	it("calls onerror", (assert, mock) => {
		assert.setTimeout(5000)
		var xhr = new XMLHttpRequest()
		xhr.open("GET", "http://0.0.0.0:0")
		xhr.onerror = () => {
			assert.equal(xhr.status, 0)
			assert.equal(xhr.statusText, "")
			assert.equal(xhr.responseXML, null)
			assert.equal(xhr.responseText, "")
			assert.end()
		}
		xhr.send()
	})

	describe("Data URLs", () => {
		var table = [
			[ "data:,Hello%2C%20World%21", "text/plain", "Hello, World!" ],
			[ "data:text/html,%3Ch1%3EHello%2C%20World%21%3C%2Fh1%3E", "text/html", "<h1>Hello, World!</h1>" ],
			[ "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==", "text/plain", "Hello, World!" ],
			[ "data:text/javascript,console.log('a')", "text/javascript", "console.log('a')" ]
		]

		it("handles invalid Data URL", assert => {
			assert.plan(2)
			assert.throws(() => {
				var xhr = new XMLHttpRequest()
				xhr.open("GET", "data:Hello")
				xhr.send()
			})
			var xhr = new XMLHttpRequest()
			xhr.onerror = err => {
				assert.ok(err)
			}
			xhr.open("GET", "data:Hello")
			xhr.send()
		})

		it("handles async request {i}", table, (url, mime, body, assert) => {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", url)
			assert.equal(xhr.responseText, "")
			xhr.onload = () => {
				assert.equal(xhr.getResponseHeader("content-type"), mime)
				assert.equal(xhr.responseText, body)
				assert.end()
			}
			xhr.send()
		})
		it("handles sync request {i}", table, (url, mime, body, assert) => {
			var xhr = new XMLHttpRequest()
			xhr.open("GET", url, false)
			xhr.send()
			assert.equal(xhr.getResponseHeader("content-type"), mime)
			assert.equal(xhr.responseText, body)
			assert.equal(xhr.readyState, 4)
			assert.end()
		})
	})
	describe("File URLs", () => {
		it("reads {0}", [
			[ "./README.md", 200, "text/plain" ],
			[ "./bad-file.txt", 404, null ]
		], (file, statusCode, type, assert, mock) => {
			mock.swap(XMLHttpRequest, "base", "file://" + process.cwd() + "/")
			var xhr = new XMLHttpRequest()
			xhr.open("GET", file)
			xhr.onload = () => {
				assert.equal(xhr.status, statusCode)
				assert.equal(xhr.getResponseHeader("content-type"), type)
				//assert.equal(xhr.responseText, data[2])
				assert.end()
			}
			xhr.send()
		})
	})

	// Blob was added in Node18
	it("has a protocolHandler", parseInt(process.versions.node) >= 18 ? assert => {
		protocolHandler.blob = (url, head, fillBody, done) => {
			var blob = require("buffer").resolveObjectURL("" + url)
			if (blob) blob.text().then(text => {
				head(200, "OK", { "content-type": blob.type, "content-length": blob.length })
				fillBody(text)
				done()
			})
			else done(Error("Blob not found"))
		}
		var url = URL.createObjectURL(new Blob(['<q id="a"><span id="b">hey!</span></q>'], { type: "text/html" }))
		var xhr = new XMLHttpRequest()
		xhr.open("GET", url)
		xhr.onload = () => {
			assert.equal(xhr.getResponseHeader("content-type"), "text/html")
			assert.equal(xhr.responseText, '<q id="a"><span id="b">hey!</span></q>')
			assert.equal(xhr.readyState, 4)
			assert.end()
		}
		xhr.send()
	} : null)
})

