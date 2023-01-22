
describe("XMLHttpRequest", function() {
	var XMLHttpRequest = require("../xmlhttprequest.js").XMLHttpRequest

	it("make request", function (assert) {
		var xhr = new XMLHttpRequest()
		xhr.open("GET", "https://litejs.com")
		xhr.responseType = "document"
		xhr.onload = function() {
			var doc = xhr.responseXML
			assert.equal(doc.documentElement.nodeName, "HTML")
			assert.equal(doc.querySelector("title").textContent, "LiteJS")
			assert.end()
		}
		xhr.send()
	})
})

