describe("Selectors", function() {
	var DOM = require("../")
	, document = DOM.document


	function append_el(id, parent, tag, content) {
		var el = document.createElement(tag || "div")
		el.id = id
		if (content) el.textContent = content
		parent.appendChild(el)
		return el
	}

	this
	.test("getElementById, getElementsByTagName, getElementsByClassName, querySelector", function (assert) {
		document = new DOM.Document()

		var result
		, el1   = append_el(1, document.body)
		, el2   = append_el(2, document.body)
		, el11  = append_el(11,  el1)
		, el12  = append_el(12,  el1)
		, el21  = append_el(21,  el2)
		, el22  = append_el(22,  el2)
		, el221 = append_el(221, el22, "span")
		, el222 = append_el(222, el22)
		, el3   = append_el(3, document.body)

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

		assert.equal(document.getElementsByClassName("findme")
		, [el21, el221])

		assert.equal(document.querySelector("html"), document.documentElement)
		assert.equal(document.querySelector("body"), document.body)

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

		assert.equal(document.querySelectorAll("div")
		, [el1, el11, el12, el2, el21, el22, el222, el3])

		assert.equal(document.querySelectorAll(".findme")
		, [el21, el221])

		assert.equal(document.querySelectorAll("span.findme")
		, [el221])

		assert.equal(document.querySelectorAll("html")
		, [document.documentElement])

		assert.equal(document.querySelectorAll("body")
		, [document.body])

		assert.equal(document.querySelectorAll("span.findme, div.findme")
		, [el21, el221])

		assert.equal(document.querySelectorAll("body span.findme, div.findme")
		, [el21, el221])

		assert.equal(el1.querySelectorAll("div")
		, [el11, el12])

		assert.end()
	})

	.test("Element.matches and Element.closest", function (assert) {
		document = new DOM.Document()

		var el1   = append_el(1, document.body, "div")
		, s1   = append_el("s1", document.body, "span")
		, s2   = append_el(2, document.body, "span")
		, a1   = append_el(3, s2, "a")
		, in1   = append_el("in1", el1, "input")
		, in2   = append_el("in2", el1, "input")

		s2.lang = "en"
		s2.name = "map[]"
		s2.setAttribute("data-space", "a b")
		s2.setAttribute("data-plus", "a+b")
		s2.setAttribute("data-comma", "a,b")
		s2.setAttribute("data-x1", "a,b]")
		s2.setAttribute("data-x2", "a,b[")
		s2.setAttribute("data-x3", "a,b(")
		s2.setAttribute("data-x4", "a,b)")

		a1.href = "#A link 1"
		a1.lang = "en-US"
		a1.foo = "en'US"

		in1.disabled = true
		in2.required = true

		assert.throws(function() { el1.matches({}) })
		assert.throws(function() { el1.matches([]) })

		assert.equal(el1.matches(null), false)
		assert.equal(el1.matches("div"), true)
		assert.equal(el1.matches("div, span"), true)
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
		assert.equal(s1.matches("div + span"), true)
		assert.equal(s2.matches("div + span"), false)
		assert.equal(s2.matches("div + div"), false)

		assert.equal(el1.matches("div ~ div"), false)
		assert.equal(s1.matches("div ~ span"), true)
		assert.equal(s1.matches("div~ span"), true)
		assert.equal(s1.matches("div ~span"), true)
		assert.equal(s2.matches("div ~ span"), true)
		assert.equal(s2.matches("div ~ div"), false)

		assert.equal(el1.matches("body div#1"), true)
		assert.equal(el1.matches("html div#1"), true)

		assert.equal(s2.matches(":empty"), false)
		assert.equal(s2.matches(":link"), false)
		assert.equal(a1.matches("a:empty"), true)
		assert.equal(a1.matches("i:empty"), false)
		assert.equal(a1.matches(":link"), true)

		assert.equal(in1.matches(":enabled"), false)
		assert.equal(in2.matches(":enabled"), true)
		assert.equal(in1.matches(":optional"), true)
		assert.equal(in2.matches(":optional"), false)

		assert.equal(el1.matches('[id=1]'), true)
		assert.equal(el1.matches('body [id=1]'), true)
		assert.equal(el1.matches('[id=true]'), false)

		assert.equal(s2.matches('[id=2]'), true)
		assert.equal(s2.matches('[id=2][lang=en]'), true)
		assert.equal(s2.matches('[id=2][lang="en"]'), true)
		assert.equal(s2.matches('[id="2"][lang=en]'), true)
		assert.equal(s2.matches('[id="2"][lang="en"]'), true)
		assert.equal(s2.matches('[name="map[]"]'), true)
		assert.equal(s2.matches('body [name="map[]"]'), true)

		assert.equal(s2.matches('[data-space]'), true)
		assert.equal(s2.matches('[data-space][data-plus]'), true)
		assert.equal(s2.matches('[data-plu]'), false)
		assert.equal(s2.matches('[data-space="a b"]'), true)
		assert.equal(s2.matches('[data-plus="a b"]'), false)
		assert.equal(s2.matches('[data-plus="a+b"]'), true)
		assert.equal(s2.matches('[data-comma="a,b"]'), true)
		assert.equal(s2.matches('div, [data-comma="a,b"]'), true)
		assert.equal(s2.matches('div[data-comma="a,b"]'), false)
		assert.equal(s2.matches('span[data-comma="a,b"]'), true)
		assert.equal(s2.matches('[data-x1="a,b]"]'), true)
		assert.equal(s2.matches('[data-x1="a,b["]'), false)
		assert.equal(s2.matches('[data-x2="a,b["]'), true)
		assert.equal(s2.matches('[data-x2="a,b]"]'), false)
		assert.equal(s2.matches('[data-x3="a,b("]'), true)
		assert.equal(s2.matches('[data-x3="a,b)"]'), false)
		assert.equal(s2.matches('[data-x4="a,b)"]'), true)
		assert.equal(s2.matches('[data-x4="a,b("]'), false)

		assert.equal(s2.matches('div, [data-x1="a,b]"]'), true)
		assert.equal(s2.matches('div, [data-x1="a,b["]'), false)
		assert.equal(s2.matches('div, [data-x2="a,b["]'), true)
		assert.equal(s2.matches('div, [data-x2="a,b]"]'), false)
		assert.equal(s2.matches('div, [data-x3="a,b("]'), true)
		assert.equal(s2.matches('div, [data-x3="a,b)"]'), false)
		assert.equal(s2.matches('div, [data-x4="a,b)"]'), true)
		assert.equal(s2.matches('div, [data-x4="a,b("]'), false)

		assert.equal(s2.matches('body > [data-space]'), true)
		assert.equal(s2.matches('body > [data-space][data-plus]'), true)
		assert.equal(s2.matches('body > [data-plu]'), false)
		assert.equal(s2.matches('body > [data-space="a b"]'), true)
		assert.equal(s2.matches('body > [data-plus="a b"]'), false)
		assert.equal(s2.matches('body > [data-plus="a+b"]'), true)

		assert.equal(a1.matches('[data-space] a'), true)
		assert.equal(a1.matches('[data-space][data-plus] a'), true)
		assert.equal(a1.matches('[data-plu] a'), false)
		assert.equal(a1.matches('[data-space="a b"] a'), true)
		assert.equal(a1.matches('[data-plus="a b"] a'), false)
		assert.equal(a1.matches('[data-plus="a+b"] a'), true)

		assert.equal(a1.matches('[href="#A link 1"]'), true)
		assert.equal(a1.matches("a[href='#A link 1']"), true)
		assert.equal(a1.matches('[href="#A"]'), false)
		assert.equal(a1.matches('[href^="#A"]'), true)
		assert.equal(a1.matches('[href^="A"]'), false)
		assert.equal(a1.matches('[href^="#Aa"]'), false)
		assert.equal(a1.matches('[foo^="en"]'), true)
		assert.equal(a1.matches('[foo^="en\'"]'), true)
		assert.equal(a1.matches('[href$=" 1"]'), true)
		assert.equal(a1.matches('[href$="  1"]'), false)
		assert.equal(a1.matches('[href*="#A"]'), true)
		assert.equal(a1.matches('[href*="#Aa"]'), false)
		assert.equal(a1.matches('[href*="link"]'), true)
		assert.equal(a1.matches('[href*=" 1"]'), true)
		assert.equal(a1.matches('[href*="  1"]'), false)
		assert.equal(a1.matches('[href~="link"]'), true)
		assert.equal(a1.matches('[href~="#A"]'), true)
		assert.equal(a1.matches('[href~="A"]'), false)
		assert.equal(s2.matches('[lang|="en"]'), true)
		assert.equal(a1.matches('[lang|="en"]'), true)
		assert.equal(a1.matches('[lang|="e"]'), false)
		assert.equal(a1.matches('[lang|="en-"]'), false)

		assert.equal(el1.matches("div:first-child"), true)
		assert.equal(el1.matches("div:not(:first-child)"), false)

		assert.equal(el1.matches("div:first-of-type"), true)
		assert.equal(in1.matches(":first-of-type"), true)
		assert.equal(in2.matches(":first-of-type"), false)
		assert.equal(el1.matches("div:not(:first-of-type)"), false)

		assert.equal(el1.matches("div:last-of-type"), true)
		assert.equal(in1.matches(":last-of-type"), false)
		assert.equal(in2.matches(":last-of-type"), true)
		assert.equal(el1.matches("div:not(:last-of-type)"), false)

		assert.equal(el1.matches("div:only-of-type"), true)
		assert.equal(s1.matches(":only-of-type"), false)
		assert.equal(s2.matches(":only-of-type"), false)
		assert.equal(in1.matches(":only-of-type"), false)
		assert.equal(in2.matches(":only-of-type"), false)
		assert.equal(el1.matches("div:not(:only-of-type)"), false)

		assert.equal(el1.matches("div:is(:first-child, :last-child)"), true)
		assert.equal(el1.matches("div:is(:not(:last-child))"), true)
		assert.equal(el1.matches("div:last-child"), false)
		assert.equal(el1.matches("div:not(:last-child)"), true)
		assert.equal(el1.matches("div:is(:first-child, :last-child)"), true)
		assert.equal(el1.matches("div:is(span, a)"), false)
		assert.equal(s2.matches("span:first-child"), false)
		assert.equal(s2.matches("span:last-child"), true)
		assert.equal(s2.matches(":only-child"), false)
		assert.equal(a1.matches(":only-child"), true)
		assert.equal(a1.matches(":root"), false)
		assert.equal(document.body.matches(":root"), false)
		assert.equal(document.documentElement.matches(":root"), true)

		assert.equal(el1.closest("div"), el1)
		assert.equal(el1.closest("body"), document.body)
		assert.equal(el1.closest("span"), null)

		assert.end()
	})

	.test(":nth-child selector", function (assert) {
		document = new DOM.Document()
		var el = document.body
		, p1   = append_el("p1", el, "p")
		, p2   = append_el("p2", el, "p")
		, p3   = append_el("p3", el, "p")
		, p4   = append_el("p4", el, "p")
		, p5   = append_el("p5", el, "p")
		, p6   = append_el("p6", el, "p")
		, p7   = append_el("p7", el, "p")
		, p8   = append_el("p8", el, "p")
		, p9   = append_el("p9", el, "p")

		assert.equal(el.querySelectorAll(":nth-child(2n)")
		, [p2, p4, p6, p8])

		assert.equal(el.querySelectorAll(":nth-child(even)")
		, [p2, p4, p6, p8])

		assert.equal(el.querySelectorAll(":nth-child(2n+1)")
		, [p1, p3, p5, p7, p9])

		assert.equal(el.querySelectorAll(":nth-child(odd)")
		, [p1, p3, p5, p7, p9])

		assert.equal(el.querySelectorAll(":nth-child(3n+3)")
		, [p3, p6, p9])

		assert.equal(el.querySelectorAll(":nth-child(4n+1)")
		, [p1, p5, p9])

		assert.equal(el.querySelectorAll(":nth-child(4n+4)")
		, [p4, p8])

		assert.equal(el.querySelectorAll(":nth-child(4n)")
		, [p4, p8])

		assert.equal(el.querySelectorAll(":nth-child(0n+1)")
		, [p1])

		assert.equal(el.querySelectorAll(":nth-child(1)")
		, [p1])

		assert.equal(el.querySelectorAll(":nth-child(3)")
		, [p3])

		assert.equal(el.querySelectorAll(":nth-child(5n-2)")
		, [p3, p8])

		assert.equal(el.querySelectorAll(":nth-child(-n+3)")
		, [p1, p2, p3])

		assert.equal(el.querySelectorAll(":nth-child(-2n+3)")
		, [p1, p3])

		assert.equal(el.querySelectorAll(":nth-child(-2n+4)")
		, [p2, p4])

		assert.end()
	})

	.test(":nth-last-child selector", function (assert) {
		document = new DOM.Document()
		var el = document.body
		, p1   = append_el("p1", el, "p")
		, p2   = append_el("p2", el, "p")
		, p3   = append_el("p3", el, "p")
		, p4   = append_el("p4", el, "p")
		, p5   = append_el("p5", el, "p")
		, p6   = append_el("p6", el, "p")
		, p7   = append_el("p7", el, "p")
		, p8   = append_el("p8", el, "p")
		, p9   = append_el("p9", el, "p")

		assert.equal(el.querySelectorAll(":nth-last-child(2n)")
		, [p2, p4, p6, p8])

		assert.equal(el.querySelectorAll(":nth-last-child(even)")
		, [p2, p4, p6, p8])

		assert.equal(el.querySelectorAll(":nth-last-child(2n+1)")
		, [p1, p3, p5, p7, p9])

		assert.equal(el.querySelectorAll(":nth-last-child(odd)")
		, [p1, p3, p5, p7, p9])

		assert.equal(el.querySelectorAll(":nth-last-child(3n+3)")
		, [p1, p4, p7])

		assert.equal(el.querySelectorAll(":nth-last-child(4n+1)")
		, [p1, p5, p9])

		assert.equal(el.querySelectorAll(":nth-last-child(4n+4)")
		, [p2, p6])

		assert.equal(el.querySelectorAll(":nth-last-child(4n)")
		, [p2, p6])

		assert.equal(el.querySelectorAll(":nth-last-child(0n+1)")
		, [p9])

		assert.equal(el.querySelectorAll(":nth-last-child(0n+3)")
		, [p7])

		assert.equal(el.querySelectorAll(":nth-last-child(1)")
		, [p9])

		assert.equal(el.querySelectorAll(":nth-last-child(3)")
		, [p7])

		assert.equal(el.querySelectorAll(":nth-last-child(5n-2)")
		, [p2, p7])

		assert.equal(el.querySelectorAll(":nth-last-child(-n+3)")
		, [p7, p8, p9])

		assert.equal(el.querySelectorAll(":nth-last-child(-2n+3)")
		, [p7, p9])

		assert.equal(el.querySelectorAll(":nth-last-child(-2n+4)")
		, [p6, p8])

		assert.end()
	})

	.test(":lang() selector", function (assert) {
		var document = new DOM.Document()
		, el = document.body
		, p1   = append_el("p1", el, "p")
		, p2   = append_el("p2", el, "p")
		, p3   = append_el("p3", p1, "p")
		, p4   = append_el("p4", p2, "p")

		el.lang = "en"
		p2.lang = "fr-be"

		assert.equal(el.querySelectorAll(":lang(en)")
		, [p1, p3])

		assert.equal(el.querySelectorAll(":lang(fr)")
		, [p2, p4])

		assert.end()
	})

	.test(":contains() selector", function (assert) {
		var document = new DOM.Document()
		, el = document.body
		, p1   = append_el(1, el, "p", "ab cd")
		, p2   = append_el(2, el, "p", "ab")
		, p3   = append_el(3, el, "a", "cd")
		, p4   = append_el(4, el, "a", "ef")

		assert.equal(el.querySelectorAll(":contains(ab)")
		, [p1, p2])

		assert.equal(el.querySelectorAll(":contains(cd)")
		, [p1, p3])

		assert.equal(el.querySelectorAll("a:contains(cd)")
		, [p3])

		assert.equal(el.querySelectorAll("a:contains(cd)~a")
		, [p4])

		assert.equal(el.querySelectorAll("a:contains(cd) ~ a")
		, [p4])

		assert.equal(el.querySelectorAll(":contains(g)")
		, [])

		assert.end()
	})
})

