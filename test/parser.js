
describe("parser", () => {
	require("@litejs/cli/snapshot")

	var { Document, DOMParser, XMLSerializer } = require("../")
	, parser = new DOMParser()
	, serializer = new XMLSerializer()
	, fs = require("fs")
	, path = require("path")
	, test = describe.test

	test("MDN DOMParser example", assert => {
		var xmlStr = '<q id="a"><span id="b">hey!</span></q>'
		, doc = parser.parseFromString(xmlStr, "application/xml")

		assert.equal(doc.documentElement, doc.firstElementChild)
		assert.equal(doc.documentElement.nodeName, "q")
		assert.equal(doc.documentElement.namespaceURI, null)
		assert.equal(doc.contentType, "application/xml")
		assert.equal(doc.querySelector("Span"), null)
		assert.equal(doc.querySelector("span").textContent, "hey!")
		assert.equal(serializer.serializeToString(doc), xmlStr)

		assert.end()
	})

	test("parse and stringify", assert => {
		assert.matchSnapshot("./test/samp1.html", str => {
			var document = new Document()
			document.documentElement.outerHTML = str
			assert.equal(document.querySelector("span").textContent, "&<>'\"")
			assert.equal(document.querySelector("span").title, "&<>'\"")
			return document.toString().replace(/--!>/g, "-->").replace(/=""/g, "")
		})
		assert.end()
	})

	test("minify {0}", [
		[ "samp1.html", "" ],
		[ "samp2.html", "text/html" ],
		[ "atom.xml", "application/xml" ],
	], (file, mime, assert) => assert.matchSnapshot("./test/" + file, str => parser.parseFromString(str, mime).toString(true)).end())

	test("parse and reminify samp1.html.snap1", assert => {
		var src = fs.readFileSync(path.resolve("./test/samp1.html.snap1"), "utf8").trim()
		, document = parser.parseFromString(src)
		, script = document.querySelector("script")
		, ul = document.getElementsByClassName("gr")[0]

		assert.equal(document.toString(true), src)
		assert.equal(
			script.textContent,
			"\ndocument.write('<p>ETAGO delimiter</p><script>console.log(\"A\")<\\/script><script>console.log(\"B\")<\\/script>')\n"
		)
		script.textContent = "document.write('<script>alert(\"<!--\")</script><script>alert(\"--!>\")</script>')"
		assert.equal(
			script.textContent,
			"document.write('<script>alert(\"<\\!--\")<\\/script><script>alert(\"--!>\")<\\/script>')"
		)
		assert.equal(
			ul.style.backgroundImage,
			"url(https://1.1.1.1:80/i.png)"
		)
		assert.end()
	})

	test("replace document", assert => {
		var document = readDom("./test/samp1.html")
		, header = document.getElementById("header")
		, comment = header.firstChild
		, comment2 = document.body.firstChild
		assert.equal(comment.nodeType, 8)
		assert.equal(comment.data, "My favorite operators are > and <!")
		assert.equal(comment2.nodeType, 8)
		assert.equal(comment2.data, " table ")

		document.innerHTML = "<html></html>"
		assert.equal("" + document, "<html></html>")

		assert.end()
	})

	test("document.title", assert => {
		var document = parser.parseFromString("<h1>Hi</h1>")
		assert.equal(document.querySelector("title"), null)
		assert.equal(document.title, "")
		document.title = "Hello"
		assert.equal(document.querySelector("title").textContent, "Hello")
		assert.equal(document.title, "Hello")
		assert.end()
	})

	test("unclosed style", assert => {
		var document = parser.parseFromString("<head><style>a<style>b")
		assert.equal(document.querySelectorAll("style").length, 1).end()
	})

	test("atom", assert => {
		var document = readDom("./test/atom.xml")

		assert.equal(document.querySelectorAll("feed").length, 1)
		assert.equal(document.querySelectorAll("feed>link").length, 2)
		assert.equal(document.querySelectorAll("entry>link").length, 3)
		//assert.equal("" + document, src)

		assert.end()
	})


	/*
	test("rdf", assert => {
		var document = readDom("./test/rdf.xml")

		//assert.equal(document.querySelectorAll("rdf\\:Description").length, 4)
		//assert.equal("" + document, src)

		assert.end()
	})

	test("rss", assert => {
		var src = readDom("./test/rss.xml")
		, document = new Document()

		document.documentElement.outerHTML = src

		assert.equal(document.documentElement.querySelectorAll("rss").length, 1)

		//assert.equal("" + document, src)

		assert.end()
	})

	*/


	function readDom(fileName) {
		var src = fs.readFileSync(path.resolve(fileName.split("?")[0]), "utf8").trim()
		, document = new Document()
		document.documentElement.outerHTML = src

		return document
	}
})

