
/*! litejs.com/MIT-LICENSE.txt */

"use strict"

exports.find = find
exports.selectorSplit = selectorSplit

var selectorCache = {
	"": () => {}
}
, selectorRe = /([.#:[])([-\w]+)(?:\(((?:[^()]|\([^)]+\))+?)\)|([~^$*|]?)=(("|')(?:\\.|[^\\])*?\6|[-\w]+))?]?/g
, selectorLastRe = /([\s>+~]*)(?:("|')(?:\\.|[^\\])*?\2|\((?:[^()]|\([^()]+\))+?\)|~=|[^'"()\s>+~])+$/
, selectorMap = exports.selectorMap = {
	"contains": "_.textContent.indexOf(v)>-1",
	"empty": "!_.lastChild",
	"enabled": "!m(_,':disabled')",
	"first-child": "(a=_.parentNode)&&a.firstChild==_",
	"first-of-type": "!p(_,_.tagName)",
	"is": "m(_,v)",
	"lang": "m(c(_,'[lang]'),'[lang|='+v+']')",
	"last-child": "(a=_.parentNode)&&a.lastChild==_",
	"last-of-type": "!n(_,_.tagName)",
	"link": "m(_,'a[href]')",
	"not": "!m(_,v)",
	"nth-child": "(a=2,'odd'==v?b=1:'even'==v?b=0:a=1 in(v=v.split('n'))?(b=v[1],v[0]):(b=v[0],0),v=_.parentNode.childNodes,v=1+v.indexOf(_),0==a?v==b:('-'==a||0==(v-b)%a)&&(0<a||v<=b))",
	"only-child": "(a=_.parentNode)&&a.firstChild==a.lastChild",
	"only-of-type": "!p(_,_.tagName)&&!n(_,_.tagName)",
	"optional": "!m(_,':required')",
	"root": "(a=_.parentNode)&&!a.tagName",
	".": "~_.className.split(/\\s+/).indexOf(a)",
	"#": "_.id==a",
	"^": "!a.indexOf(v)",
	"|": "a.split('-')[0]==v",
	"$": "a.slice(-v.length)==v",
	"~": "~a.split(/\\s+/).indexOf(v)",
	"*": "~a.indexOf(v)",
	">>": "m(_.parentNode,v)",
	"++": "m(_.previousElementSibling,v)",
	"~~": "p(_,v)",
	"": "c(_.parentNode,v)"
}
, closest = exports.closest = walk.bind(exports, "parentNode", 1)
, matches = exports.matches = (el, sel) => !!selectorFn(sel)(el)
, next = exports.next = (el, sel) => walk("nextSibling", 1, el.nextSibling, sel)
, prev = exports.prev = (el, sel) => walk("previousSibling", 1, el.previousSibling, sel)


selectorMap["nth-last-child"] = selectorMap["nth-child"].replace("1+", "v.length-")

function selectorFn(str) {
	if (str != null && typeof str !== "string") throw Error("Invalid selector")
	return selectorCache[str || ""] ||
	(selectorCache[str] = Function("m,c,n,p", "return (_,v,a,b)=>" +
		selectorSplit(str).map(sel => {
			var relation, from
			, rules = ["_&&_.nodeType==1"]
			, parentSel = sel.replace(selectorLastRe, (_, _rel, a, start) => {
				from = start + _rel.length
				relation = _rel.trim()
				return ""
			})
			, tag = sel.slice(from).replace(selectorRe, (_, op, key, subSel, fn, val, quotation) => {
				rules.push(
					"((v='" +
					(subSel || (quotation ? val.slice(1, -1) : val) || "").replace(/[\\']/g, "\\$&") +
					"'),(a='" + key + "'),1)"
					,
					selectorMap[op == ":" ? key : op] ||
					"(a=_.getAttribute(a))" +
					(fn ? "&&" + selectorMap[fn] : val ? "==v" : "!==null")
				)
				return ""
			})

			if (tag && tag != "*") rules[0] += "&&_.tagName==(_.namespaceURI?'" + tag.toUpperCase() + "':'" + tag + "')"
			if (parentSel) rules.push("(v='" + parentSel + "')", selectorMap[relation + relation])
			return rules.join("&&")
		}).join("||")
	)(matches, closest, next, prev))
}

function selectorSplit(text) {
	for (var char, inQuote, depth = 0, start = 0, pos = 0, len = text.length, out = []; pos < len; ) {
		char = text[pos++]
		if (char === "\\") {
			pos++
		} else if (inQuote) {
			if (char === inQuote) inQuote = ""
		} else if (char === "'" || char === "\"") {
			inQuote = char
		} else if (char === "(" || char === "[") {
			depth++
		} else if (char === ")" || char === "]") {
			depth--
		} else if (char === "," && depth === 0) {
			out.push(text.slice(start, (start = pos) - 1).trim())
		}
	}
	out.push(text.slice(start).trim())
	return out
}

function walk(attr, first, el, sel, nextFn) {
	sel = selectorFn(sel)
	for (var out = []; el; el = el[attr] || nextFn && nextFn(el)) if (sel(el)) {
		if (first) return el
		out.push(el)
	}
	return first ? null : out
}

function find(node, sel, first) {
	return walk("firstChild", first, node.firstChild, sel, (el, pos) => {
		for (pos = el.nextSibling; !pos && ((el = el.parentNode) !== node); ) pos = el.nextSibling
		return pos
	})
}

