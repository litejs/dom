
describe("parser", function() {
	var DOM = require("../")
	, fs = require("fs")
	, path = require("path")
	, test = describe.test


	test("replace document", function (assert) {
		var src = readFile("./test/samp1.html")
		, document = new DOM.Document()

		document.documentElement.outerHTML = src
		assert.equal(document.toString(), src.replace(/--!>/g, "-->"))

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

		document.innerHTML = src
		assert.equal("" + document, src.replace(/--!>/g, "-->"))

		assert.end()
	})

	test("atom", function (assert) {
		var src = readFile("./test/atom.xml")
		, document = new DOM.Document()

		document.documentElement.outerHTML = src

		assert.equal(document.querySelectorAll("feed").length, 1)
		assert.equal(document.querySelectorAll("feed>link").length, 2)
		assert.equal(document.querySelectorAll("entry>link").length, 3)
		//assert.equal("" + document, src)

		assert.end()
	})

	/*
	test("rdf", function (assert) {
		var src = readFile("./test/rdf.xml")
		, document = new DOM.Document()

		document.innerHTML = src

		//assert.equal(document.querySelectorAll("rdf\\:Description").length, 4)
		//assert.equal("" + document, src)

		assert.end()
	})

	test("rss", function (assert) {
		var src = readFile("./test/rss.xml")
		, document = new DOM.Document()

		document.documentElement.outerHTML = src

		assert.equal(document.documentElement.querySelectorAll("rss").length, 1)

		//assert.equal("" + document, src)

		assert.end()
	})

	*/


	function readFile(fileName) {
		return fs.readFileSync(path.resolve(fileName.split("?")[0]), "utf8").trim()
	}


})
