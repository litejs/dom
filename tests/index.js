var test = require("tape")

var DOM = require("../")
, document = DOM.document

test("document is a Document", function (assert) {
	assert.equal(typeof document.createTextNode, "function")
	assert.equal(typeof document.createElement, "function")
	assert.equal(typeof document.createDocumentFragment, "function")

	assert.end()
})

test("can create nodes", function (assert) {
	var el, undef

	el = document.createElement("h1")
	assert.equal(el.nodeType, 1)
	assert.equal(el.nodeName, "H1")
	assert.equal(el.nodeValue, null)
	assert.equal((el.nodeValue = "value"), "value")
	assert.equal(el.nodeValue, null)
	assert.equal(el.textContent, "")

	el = document.createDocumentFragment()
	assert.equal(el.nodeType, 11)
	assert.equal(el.nodeName, "#document-fragment")
	assert.equal(el.nodeValue, null)
	assert.equal((el.nodeValue = "value"), "value")
	assert.equal(el.nodeValue, null)
	assert.equal(el.textContent, "")

	el = document.createTextNode("hello")
	assert.equal(el.nodeType, 3)
	assert.equal(el.nodeName, "#text")
	assert.equal(el.data, "hello")
	assert.equal(el.nodeValue, "hello")
	assert.equal(el.textContent, "hello")
	assert.equal((el.nodeValue = "value"), "value")
	assert.equal(el.data, "value")
	assert.equal(el.nodeValue, "value")
	assert.equal(el.textContent, "value")

	el = document.createTextNode(null)
	assert.equal("" + el, "null")

	el = document.createTextNode(undef)
	assert.equal("" + el, "undefined")

	el = document.createTextNode(123)
	assert.equal("" + el, "123")

	el = document.createComment("hello comment")
	assert.equal(el.nodeType, 8)
	assert.equal(el.nodeName, "#comment")
	assert.equal(el.data, "hello comment")
	assert.equal(el.nodeValue, "hello comment")
	assert.equal(el.outerHTML, "<!--hello comment-->")
	assert.equal((el.nodeValue = "value"), "value")
	assert.equal(el.data, "value")
	assert.equal(el.nodeValue, "value")
	assert.equal(el.outerHTML, "<!--value-->")

	assert.end()
})

test("can create elements with namespace", function (assert) {
	var el = document.createElementNS(null, "clipPath")
	assert.equal("" + el, "<clipPath></clipPath>")

	assert.end()
})

test("can clone HTMLElements", function (assert) {
	var el = document.createElement("a")

	function testAttr(name, value, propName) {
		el[propName || name] = value
		assert.equal(el.getAttribute(name), value)
		assert.equal("" + el[propName || name], value)

		el.setAttribute(name, "val-"+value)
		assert.equal(el.getAttribute(name), "val-"+value)
		assert.equal("" + el[propName || name], "val-"+value)

		el.removeAttribute(name)
		assert.equal(!!el.getAttribute(name), false)
		value = el[propName || name]
		assert.equal(!!(value && ("" + value)), false)
	}

	testAttr("id", "123")
	testAttr("class", "my-class", "className")
	testAttr("for", "my-field", "htmlFor")
	testAttr("style", "top: 1px")
	testAttr("title", "Header")
	testAttr("href", "#123")
	testAttr("href", "http://example.com")

	assert.end()
})

test("can clone HTMLElements", function (assert) {
	var el, clone, deepClone

	el = document.createElement("h1")
	el.appendChild(document.createElement("img"))
	el.id = 1
	el.style.top = "5px"
	clone = el.cloneNode()
	deepClone = el.cloneNode(true)

	assert.notEqual(el, clone)
	assert.notEqual(el.style, clone.style)
	assert.notEqual(el.childNodes, clone.childNodes)

	assert.equal(el.nodeName, "H1")
	assert.equal(el.tagName, "H1")
	assert.equal(el.localName, "h1")
	assert.equal(el.id, 1)
	assert.equal(el.style.top, "5px")
	assert.equal(clone.nodeName, "H1")
	assert.equal(clone.tagName, "H1")
	assert.equal(clone.localName, "h1")
	assert.equal(clone.id, 1)
	assert.equal(clone.style.top, "5px")
	assert.equal(el.ownerDocument, clone.ownerDocument)
	assert.equal(el.ownerDocument, deepClone.ownerDocument)

	assert.equal(deepClone.outerHTML, "<h1 id=\"1\" style=\"top: 5px\"><img></h1>")

	clone.id = 2
	assert.equal(el.id, 1)
	assert.equal(clone.id, 2)

	assert.end()
})

test("can clone Text", function (assert) {
	var el, clone

	el = document.createTextNode("hello world")
	clone = el.cloneNode()

	assert.notEqual(el, clone)
	assert.equal(""+el, ""+clone)

	assert.end()
})

test("can do stuff", function (assert) {
	var div = document.createElement("div")
	div.className = "foo bar"

	var span = document.createElement("span")
	div.appendChild(span)
	span.textContent = "Hello!"

	var html = String(div)

	assert.equal(html, "<div class=\"foo bar\">" +
		"<span>Hello!</span></div>")

	assert.equal(div.outerHTML, "<div class=\"foo bar\">" +
		"<span>Hello!</span></div>")

	assert.equal(div.innerHTML, "<span>Hello!</span>")

	assert.end()
})


function testNode(assert, mask, node) {
	var p  = document.createElement("p")
	, h1 = document.createElement("h1")
	, h2 = document.createElement("h2")

	h1.textContent = "Head"

	assert.equal(node.appendChild(h2), h2)
	assert.equal(""+node, mask.replace("%s", "<h2></h2>"))

	assert.equal(node.insertBefore(h1, h2), h1)
	assert.equal(""+node, mask.replace("%s", "<h1>Head</h1><h2></h2>"))

	assert.equal(node.appendChild(h1), h1)
	assert.equal(""+node, mask.replace("%s", "<h2></h2><h1>Head</h1>"))

	assert.equal(node.removeChild(h1), h1)
	assert.equal(""+node, mask.replace("%s", "<h2></h2>"))

	assert.equal(node.replaceChild(h1, h2), h2)
	assert.equal(""+node, mask.replace("%s", "<h1>Head</h1>"))

	assert.equal(node.appendChild(h2), h2)
	assert.equal(node.firstChild, h1)
	assert.equal(node.lastChild, h2)
	assert.equal(h1.previousSibling, null)
	assert.equal(h1.nextSibling, h2)
	assert.equal(h2.previousSibling, h1)
	assert.equal(h2.nextSibling, null)
	p.appendChild(node)
	assert.equal(""+p, "<p>"+mask.replace("%s", "<h1>Head</h1><h2></h2>")+"</p>")

	assert.equal(p.textContent, "Head")
	p.textContent = "Hello"
	assert.equal(""+p, "<p>Hello</p>")
}

test("HTMLElement", function (assert) {
	testNode(assert, "<body>%s</body>", document.body)

	assert.end()
})

test("HTMLElement.attributes", function (assert) {
	var h1 = document.createElement("h1")
	h1.id = "123"
	h1.setAttribute("id2", "321")
	assert.equal(h1.getAttribute("id"), "123")
	assert.equal(h1.getAttribute("id2"), "321")

	h1.removeAttribute("id2")
	assert.equal(h1.getAttribute("id"), "123")
	assert.equal(h1.getAttribute("id2"), null)
	assert.equal(h1.attributes.length, 1)
	assert.equal(h1.attributes[0].name, "id")
	assert.equal(h1.attributes[0].value, "123")

	assert.equal(h1.getAttribute("toString"), null)
	assert.equal(""+h1, '<h1 id="123"></h1>')

	h1.className = "my-class"
	assert.equal(""+h1, '<h1 id="123" class="my-class"></h1>')
	assert.equal(h1.attributes.length, 2)
	assert.equal(h1.attributes[1].name, "class")
	assert.equal(h1.attributes[1].value, "my-class")


	h1.style.top = "5px"
	h1.style.left = "15px"
	assert.equal(""+h1, '<h1 id="123" class="my-class" style="top: 5px; left: 15px"></h1>')
	assert.equal(h1.attributes.length, 3)
	assert.equal(h1.attributes[2].name, "style")
	assert.equal(h1.attributes[2].value, "top: 5px; left: 15px")

	h1.attributes[2].value = "top: 15px;"
	assert.equal(h1.attributes[2].value, "top: 15px")

	h1.removeAttribute('style')
	h1.removeAttribute('class')
	h1.removeAttribute('id')
	h1.setAttribute('getAttribute', 'Get me')
	assert.equal(h1.getAttribute('GetAttribute'), 'Get me')
	h1.setAttribute('no-value', '')
	h1.setAttribute('constructor', 'not the constructor')
	assert.equal(h1.toString(), '<h1 getattribute="Get me" no-value constructor="not the constructor"></h1>')
	assert.equal(h1.getAttribute('no-value'), '')
	h1.removeAttribute('no-value')
	h1.removeAttribute('constructor')
	h1.removeAttribute('getAttribute')
	assert.equal(h1.getAttribute('no-value'), null)
	assert.equal(h1.constructor, Object.getPrototypeOf(h1).constructor)
	assert.equal(h1.toString(), '<h1></h1>')

	assert.end()
})

test("documentFragment", function (assert) {
	var frag = document.createDocumentFragment()

	testNode(assert, "%s", frag)

	assert.end()
})

function append_el(id, parent, tag) {
	var el = document.createElement(tag || "div")
	el.id = id
	parent.appendChild(el)
	return el
}


test("getElementById, getElementsByTagName, getElementsByClassName, querySelector", function (assert) {
	var result

	document = new DOM.Document()

	var el1   = append_el(1, document.body)
	var el2   = append_el(2, document.body)

	var el11  = append_el(11,  el1)
	var el12  = append_el(12,  el1)
	var el21  = append_el(21,  el2)
	var el22  = append_el(22,  el2)
	var el221 = append_el(221, el22, "span")
	var el222 = append_el(222, el22)
	var el3   = append_el(3, document.body)

	el21.className = "findme first"
	el222.setAttribute("type", "text/css")
	el221.className = "findme"

	assert.equal(document.body.appendChild(el3), el3)

	assert.equal(document.getElementById(1),    el1)
	assert.equal(document.getElementById("2"),  el2)
	assert.equal(document.getElementById(3),    el3)
	assert.equal(document.getElementById(11),   el11)
	assert.equal(document.getElementById(12),   el12)
	assert.equal(document.getElementById(21),   el21)
	assert.equal(document.getElementById(22),   el22)
	assert.equal(document.getElementById(221),  el221)
	assert.equal(document.getElementById(222),  el222)

	assert.equal(document.getElementsByTagName("div").length,  8)

	result = document.getElementsByTagName("span")
	assert.equal(result.length,  1)
	assert.equal(result[0], el221)

	result = document.getElementsByClassName("findme")
	assert.equal(result.length, 2)
	assert.equal(result[0], el21)
	assert.equal(result[1], el221)

	assert.equal(document.querySelector("span"),      el221)
	assert.equal(document.querySelector("#22"),       el22)
	assert.equal(document.querySelector("div#22"),    el22)
	assert.equal(document.querySelector("span#22"),   null)

	assert.equal(document.querySelector(".findme"),         el21)
	assert.equal(document.querySelector(".not_found"),      null)
	assert.equal(document.querySelector("div.findme"),      el21)
	assert.equal(document.querySelector("div.not_found"),   null)
	assert.equal(document.querySelector("span.first"),      null)
	assert.equal(document.querySelector("span.not_found"),  null)
	assert.equal(document.querySelector("#21.findme"),      el21)
	assert.equal(document.querySelector("div#21.findme"),   el21)

	assert.equal(document.querySelectorAll("div").length,         8)

	result = document.querySelectorAll(".findme")
	assert.equal(result.length, 2)
	assert.equal(result[0], el21)
	assert.equal(result[1], el221)

	result = document.querySelectorAll("span.findme")
	assert.equal(result.length, 1)
	assert.equal(result[0], el221)

	assert.equal(document.querySelectorAll("html").length,        1)
	assert.equal(document.querySelectorAll("body").length,        1)
	assert.equal(document.querySelector("html"), document.documentElement)
	assert.equal(document.querySelector("body"), document.body)

	assert.equal(document.querySelectorAll("span.findme, div.findme").length, 2)
	assert.equal(document.querySelectorAll("body span.findme, div.findme").length, 2)

	assert.equal(el1.querySelectorAll("div").length, 2)

	assert.end()
})


test("Element.matches and Element.closest", function (assert) {
	document = new DOM.Document()

	var el1   = append_el(1, document.body, "div")
	var el2   = append_el(2, document.body, "span")
	var el3   = append_el(3, el2, "a")
	el2.lang = "en"
	el2.name = "map[]"
	el3.href = "#A link 1"
	el3.lang = "en-US"
	el3.foo = "en'US"

	assert.equal(el1.matches("div"), true)
	assert.equal(el1.matches("span"), false)
	assert.equal(el1.matches("#1"), true)
	assert.equal(el1.matches("#2"), false)
	assert.equal(el1.matches("div#1"), true)
	assert.equal(el1.matches("div#2"), false)

	assert.equal(el1.matches("body > div#1"), true)
	assert.equal(el1.matches("body > *"), true)
	assert.equal(el1.matches("*"), true)
	assert.equal(el1.matches("body > div#2"), false)
	assert.equal(el1.matches("html > div#1"), false)
	assert.equal(el1.matches("html > div#2"), false)

	assert.equal(el1.matches("div + div"), false)
	assert.equal(el2.matches("div + div"), false)
	assert.equal(el2.matches("div + span"), true)

	assert.equal(el1.matches("body div#1"), true)
	assert.equal(el1.matches("html div#1"), true)

	assert.equal(el1.matches("div:empty"), true)
	assert.equal(el2.matches(":empty"), false)
	assert.equal(el2.matches(":link"), false)
	assert.equal(el3.matches(":link"), true)

	assert.equal(el1.matches('[id=1]'), true)
	assert.equal(el2.matches('[id=2]'), true)
	assert.equal(el2.matches('[id=2][lang=en]'), true)
	assert.equal(el2.matches('[id=2][lang="en"]'), true)
	assert.equal(el2.matches('[id="2"][lang=en]'), true)
	assert.equal(el2.matches('[id="2"][lang="en"]'), true)
	assert.equal(el2.matches('[name="map[]"]'), true)
	assert.equal(el1.matches('[id=true]'), false)
	assert.equal(el3.matches('[href="#A link 1"]'), true)
	assert.equal(el3.matches("a[href='#A link 1']"), true)
	assert.equal(el3.matches('[href="#A"]'), false)
	assert.equal(el3.matches('[href^="#A"]'), true)
	assert.equal(el3.matches('[href^="#Aa"]'), false)
	assert.equal(el3.matches('[href$=" 1"]'), true)
	assert.equal(el3.matches('[href$="  1"]'), false)
	assert.equal(el3.matches('[href*="#A"]'), true)
	assert.equal(el3.matches('[href*="#Aa"]'), false)
	assert.equal(el3.matches('[href*="link"]'), true)
	assert.equal(el3.matches('[href*=" 1"]'), true)
	assert.equal(el3.matches('[href*="  1"]'), false)
	assert.equal(el3.matches('[href~="link"]'), true)
	assert.equal(el3.matches('[href~="#A"]'), true)
	assert.equal(el3.matches('[href~="A"]'), false)
	assert.equal(el2.matches('[lang|="en"]'), true)
	assert.equal(el3.matches('[lang|="en"]'), true)
	assert.equal(el3.matches('[lang|="e"]'), false)
	assert.equal(el3.matches('[lang|="en-"]'), false)
	assert.equal(el3.matches('[foo^="en"]'), true)
	assert.equal(el3.matches('[foo^="en\'"]'), true)

	assert.equal(el1.matches("div:first-child"), true)
	assert.equal(el1.matches("div:last-child"), false)
	assert.equal(el2.matches("span:first-child"), false)
	assert.equal(el2.matches("span:last-child"), true)

	assert.equal(el1.closest("div"), el1)
	assert.equal(el1.closest("body"), document.body)
	assert.equal(el1.closest("span"), null)

	assert.end()
})






