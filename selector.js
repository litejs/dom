
/*! litejs.com/MIT-LICENSE.txt */

"use strict"

!function(exports) {
	var selectorCache = {
		"": function() {}
	}
	, selectorRe = /([.#:[])([-\w]+)(?:\(((?:[^()]|\([^)]+\))+?)\)|([~^$*|]?)=(("|')(?:\\.|[^\\])*?\6|[-\w]+))?]?/g
	, selectorLastRe = /([\s>+~]*)(?:("|')(?:\\.|[^\\])*?\2|\((?:[^()]|\([^()]+\))+?\)|~=|[^'"()\s>+~])+$/
	, selectorSplitRe = /\s*,\s*(?=(?:[^'"()]|"(?:\\.|[^\\"])*?"|'(?:\\.|[^\\'])*?'|\((?:[^()]|\([^()]+\))+?\))+$)/
	, selectorMap = {
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
		"++": "m(_.previousSibling,v)",
		"~~": "p(_,v)",
		"": "c(_.parentNode,v)"
	}
	, closest = exports.closest = walk.bind(exports, "parentNode", 1)


	selectorMap["nth-last-child"] = selectorMap["nth-child"].replace("1+", "v.length-")

	function selectorFn(str) {
		if (str != null && typeof str !== "string") throw Error("Invalid selector")
		return selectorCache[str || ""] ||
		(selectorCache[str] = Function("m,c,n,p", "return function(_,v,a,b){return " +
			str.split(selectorSplitRe).map(function(sel) {
				var relation, from
				, rules = ["_&&_.nodeType==1"]
				, parentSel = sel.replace(selectorLastRe, function(_, _rel, a, start) {
					from = start + _rel.length
					relation = _rel.trim()
					return ""
				})
				, tag = sel.slice(from).replace(selectorRe, function(_, op, key, subSel, fn, val, quotation) {
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
			}).join("||") + "}"
		)(matches, closest, next, prev))
	}


	function walk(next, first, el, sel, nextFn) {
		sel = selectorFn(sel)
		for (var out = []; el; el = el[next] || nextFn && nextFn(el)) if (sel(el)) {
			if (first) return el
			out.push(el)
		}
		return first ? null : out
	}

	function find(node, sel, first) {
		return walk("firstChild", first, node.firstChild, sel, function(el) {
			for (var next = el.nextSibling; !next && ((el = el.parentNode) !== node); ) next = el.nextSibling
			return next
		})
	}

	function matches(el, sel) {
		return !!selectorFn(sel)(el)
	}

	function next(el, sel) {
		return walk("nextSibling", 1, el.nextSibling, sel)
	}

	function prev(el, sel) {
		return walk("previousSibling", 1, el.previousSibling, sel)
	}

	exports.find = find
	exports.matches = matches
	exports.next = next
	exports.prev = prev
	exports.selectorMap = selectorMap
}(this) // jshint ignore:line

