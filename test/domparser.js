
describe("DOMParser", function() {
	var DOMParser = require("../").DOMParser
	, XMLSerializer = require("../").XMLSerializer

	this
	.test("MDN DOMParser example", function (assert) {
		var xmlStr = '<q id="a"><span id="b">hey!</span></q>'
		, parser = new DOMParser()
		, serializer = new XMLSerializer()
		, doc = parser.parseFromString(xmlStr, "application/xml")

		// print the name of the root element or error message
		//const errorNode = doc.querySelector("parsererror")
		//if (errorNode) {
		//	console.log("error while parsing")
		//} else {
		//	console.log(doc.documentElement.nodeName)
		//}

		assert.equal(doc.documentElement.nodeName, "q")
		assert.equal(doc.documentElement.namespaceURI, null)
		assert.equal(doc.contentType, "application/xml")
		assert.equal(serializer.serializeToString(doc), xmlStr)

		assert.end()
	})
})


