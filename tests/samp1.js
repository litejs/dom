
var DOM = require("../")
, fs = require("fs")
, path = require("path")
, test = require("testman").test
, document = new DOM.Document()
, src = readFile("./tests/samp1.html").trim()


test("replace document", function (assert) {
	document.documentElement.innerHTML = src
	document.childNodes = [document.documentElement = document.documentElement.firstChild]

	assert.equal("" + document, src)

	assert.end()
})


function readFile(fileName) {
	return fs.readFileSync(path.resolve(fileName.split("?")[0]), "utf8")
}

