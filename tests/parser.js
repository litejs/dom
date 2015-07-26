
var DOM = require("../")
, fs = require("fs")
, path = require("path")
, test = require("testman").test


test("replace document", function (assert) {
	var src = readFile("./tests/samp1.html")
	, document = new DOM.Document()

	document.documentElement.outerHTML = src
	assert.equal("" + document, src)

	document.innerHTML = "<html></html>"
	assert.equal("" + document, "<html></html>")

	document.innerHTML = src
	assert.equal("" + document, src)

	assert.end()
})

test("atom", function (assert) {
	var src = readFile("./tests/atom.xml")
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
	var src = readFile("./tests/rdf.xml")
	, document = new DOM.Document()

	document.innerHTML = src

	//assert.equal(document.querySelectorAll("rdf\\:Description").length, 4)
	//assert.equal("" + document, src)

	assert.end()
})

test("rss", function (assert) {
	var src = readFile("./tests/rss.xml")
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

