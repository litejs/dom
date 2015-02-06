
var el
, dom = require("./")
, document = dom.document
, rules = [
	{ selector: "*", ruleset: { color: "black" }},
	{ selector: "body", ruleset: { backgroundColor: "white" }},
	{ selector: ".a, .b", ruleset: { color: "red" }}
]

Object.defineProperty(dom.HTMLElement.prototype, "style", {
	get: function() {
		var i, j, key, rule
		, node = this
		, path = [node]
		, elStyle = node.styleMap
		, cssStyle = new dom.StyleMap()

		for (; node = node.parentNode; ) if (node.tagName) path.unshift(node)
		for (i = 0; node = path[i++]; ) {
			for (j = 0; rule = rules[j++]; ) if (node.matches(rule.selector)) {
				for (key in rule.ruleset) cssStyle[key] = rule.ruleset[key]
			}
		}
		for (key in elStyle) cssStyle[key] = elStyle[key]
		return cssStyle
	}
})

el = document.createElement("div")
el.className = "a"
document.body.appendChild(el)

el = document.createElement("p")
el.className = "b"
document.body.appendChild(el)

console.log(""+document)


