
var el
, dom = require("./")
, document = dom.document
, rules = [
	{ selector: "*", ruleset: { color: "black" }},
	{ selector: "body", ruleset: { backgroundColor: "white" }},
	{ selector: ".a, .b", ruleset: { color: "red" }}
]

function updateStyles(doc, rules) {
	var i, j, rule, node, style
	, nodes = doc.getElementsByTagName("*")
	for (i = 0; node = nodes[i++]; ) {
		for (j = 0; rule = rules[j++]; ) if (node.matches(rule.selector)) {
			style = node.style
			for (key in rule.ruleset) style[key] = rule.ruleset[key]
		}
	}
}

el = document.createElement("div")
el.className = "a"
document.body.appendChild(el)

el = document.createElement("p")
el.className = "b"
document.body.appendChild(el)

updateStyles(document, rules)

console.log(""+document)


