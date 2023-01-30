
describe("parser", function() {
	require("@litejs/cli/snapshot")

	var DOM = require("../")
	, parser = new DOM.DOMParser()
	, fs = require("fs")
	, path = require("path")
	, test = describe.test


	test("parse and stringify", function (assert) {
		assert.matchSnapshot("./test/samp1.html", function(str) {
			var document = new DOM.Document()
			document.documentElement.outerHTML = str
			assert.equal(document.querySelector("span").textContent, "&<>'\"")
			assert.equal(document.querySelector("span").name, "&<>'\"")
			return document.toString().replace(/--!>/g, "-->").replace(/=""/g, "")
		})
		assert.end()
	})
	test("minify", function (assert) {
		assert.matchSnapshot("./test/samp1.html", function(str) {
			var document = new DOM.Document()
			document.documentElement.outerHTML = str
			return document.toString(true)
		})
		assert.matchSnapshot("./test/samp2.html", function(str) {
			var document = new DOM.Document()
			document.documentElement.outerHTML = str
			return document.toString(true)
		})
		assert.matchSnapshot("./test/atom.xml", function(str) {
			return parser.parseFromString(str, "application/xml").toString(true)
		})
		assert.end()
	})

	test("replace document", function (assert) {
		var document = readDom("./test/samp1.html")

		var header = document.getElementById("header")
		, table = document.getElementsByTagName("table")[0]
		, comment = header.firstChild
		, comment2 = table.firstChild
		assert.equal(comment.nodeType, 8)
		assert.equal(comment.data, "My favorite operators are > and <!")
		assert.equal(comment2.nodeType, 8)
		assert.equal(comment2.data, " table ")

		document.innerHTML = "<html></html>"
		assert.equal("" + document, "<html></html>")

		assert.end()
	})

	test("atom", function (assert) {
		var document = readDom("./test/atom.xml")

		assert.equal(document.querySelectorAll("feed").length, 1)
		assert.equal(document.querySelectorAll("feed>link").length, 2)
		assert.equal(document.querySelectorAll("entry>link").length, 3)
		//assert.equal("" + document, src)

		assert.end()
	})


	/*
	test("rdf", function (assert) {
		var document = readDom("./test/rdf.xml")

		//assert.equal(document.querySelectorAll("rdf\\:Description").length, 4)
		//assert.equal("" + document, src)

		assert.end()
	})

	test("rss", function (assert) {
		var src = readDom("./test/rss.xml")
		, document = new DOM.Document()

		document.documentElement.outerHTML = src

		assert.equal(document.documentElement.querySelectorAll("rss").length, 1)

		//assert.equal("" + document, src)

		assert.end()
	})

	*/


	function readDom(fileName) {
		var src = fs.readFileSync(path.resolve(fileName.split("?")[0]), "utf8").trim()
		, document = new DOM.Document()
		document.documentElement.outerHTML = src

		return document
	}


})
