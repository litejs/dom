
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
			assert.equal(document.querySelector("span").title, "&<>'\"")
			return document.toString().replace(/--!>/g, "-->").replace(/=""/g, "")
		})
		assert.end()
	})
	test("minify samp1.html", function (assert) {
		assert.matchSnapshot("./test/samp1.html", function(str) {
			var document = new DOM.Document()
			document.documentElement.outerHTML = str
			var script = document.querySelector("script")
			, ul = document.getElementsByClassName("gr")[0]
			, result = document.toString(true)
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
				"url('https://1.1.1.1:80/i.png')"
			)
			return result
		})
		assert.end()
	})
	test("parse and reminify samp1.html.snap1", function (assert) {
		var src = fs.readFileSync(path.resolve("./test/samp1.html.snap1"), "utf8").trim()
		assert.equal(parser.parseFromString(src).toString(true), src)
		assert.end()
	})
	test("minify samp2.html", function (assert) {
		assert.matchSnapshot("./test/samp2.html", function(str) {
			var document = new DOM.Document()
			document.documentElement.outerHTML = str
			return document.toString(true)
		})
		assert.end()
	})
	test("minify atom.xml", function (assert) {
		assert.matchSnapshot("./test/atom.xml", function(str) {
			return parser.parseFromString(str, "application/xml").toString(true)
		})
		assert.end()
	})

	test("replace document", function (assert) {
		var document = readDom("./test/samp1.html")

		var header = document.getElementById("header")
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

	test("document.title", function(assert) {
		var document = parser.parseFromString("<h1>Hi</h1>")
		assert.equal(document.querySelector("title"), null)
		assert.equal(document.title, "")
		document.title = "Hello"
		assert.equal(document.querySelector("title").textContent, "Hello")
		assert.equal(document.title, "Hello")
		assert.end()
	})

	test("unclosed style", function(assert) {
		var document = parser.parseFromString("<head><style>a<style>b")
		assert.equal(document.querySelectorAll("style").length, 1)
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
