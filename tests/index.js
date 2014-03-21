var test = require("tape")

var document = require("../").document

test("document is a Document", function (assert) {
    assert.equal(typeof document.createTextNode, "function")
    assert.equal(typeof document.createElement, "function")
    assert.equal(typeof document.createDocumentFragment, "function")

    assert.end()
})

test("can create nodes", function (assert) {
    var el;

    el = document.createElement("h1")
    assert.equal(el.nodeType, 1)
    assert.equal(el.nodeName, "h1")
    assert.equal(el.textContent, "")

    el = document.createDocumentFragment()
    assert.equal(el.nodeType, 11)
    assert.equal(el.nodeName, "#document-fragment")
    assert.equal(el.textContent, "")

    el = document.createTextNode("hello")
    assert.equal(el.nodeType, 3)
    assert.equal(el.nodeName, "#text")
    assert.equal(el.textContent, "hello")

    assert.end()
})

test("can clone HTMLElements", function (assert) {
    var el, clone;

    el = document.createElement("h1")
    el.id = 1
    el.style.top = "5px"
    clone = el.cloneNode()

    assert.notEqual(el, clone)
    assert.notEqual(el.style, clone.style)
    assert.notEqual(el.childNodes, clone.childNodes)

    assert.equal(el.nodeName, "h1")
    assert.equal(el.id, 1)
    assert.equal(el.style.top, "5px")
    assert.equal(clone.nodeName, "h1")
    assert.equal(clone.id, 1)
    assert.equal(clone.style.top, "5px")

    clone.id = 2
    assert.equal(el.id, 1)
    assert.equal(clone.id, 2)

    assert.end()
})

test("can clone Text", function (assert) {
    var el, clone;

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

    assert.end()
})


function testNode(assert, mask, node) {
    var h1 = document.createElement("h1")
    var h2 = document.createElement("h2")

    assert.equal(node.appendChild(h2), h2)
    assert.equal(""+node, mask.replace("%s", "<h2></h2>"))

    assert.equal(node.insertBefore(h1, h2), h1)
    assert.equal(""+node, mask.replace("%s", "<h1></h1><h2></h2>"))

    assert.equal(node.appendChild(h1), h1)
    assert.equal(""+node, mask.replace("%s", "<h2></h2><h1></h1>"))

    assert.equal(node.removeChild(h1), h1)
    assert.equal(""+node, mask.replace("%s", "<h2></h2>"))

    assert.equal(node.replaceChild(h1, h2), h2)
    assert.equal(""+node, mask.replace("%s", "<h1></h1>"))
}

test("HTMLElement", function (assert) {
    testNode(assert, "<body>%s</body>", document.body)

    assert.end()
})

test("HTMLElement.attributes", function (assert) {
    var h1 = document.createElement("h1")
    h1.id = 123
    assert.equal(""+h1, '<h1 id="123"></h1>')

    h1.className = "my-class"
    assert.equal(""+h1, '<h1 id="123" class="my-class"></h1>')

    h1.style.top = "5px"
    h1.style.left = "15px"
    assert.equal(""+h1, '<h1 id="123" class="my-class" style="top:5px;left:15px;"></h1>')

    assert.end()
})

test("documentFragment", function (assert) {
    var frag = document.createDocumentFragment()

    testNode(assert, "%s", frag)

    assert.end()
})


test("getElementById, getElementsByTagName, querySelector", function (assert) {

    function append_el(id, parent, tag) {
        var el = document.createElement(tag || "div")
        el.id = id
        parent.appendChild(el)
        return el
    }

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
    assert.equal(document.getElementsByTagName("span").length,  1)

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
    assert.equal(document.querySelectorAll(".findme").length,     2)
    assert.equal(document.querySelectorAll("span.findme").length, 1)
    assert.end()
})

