

/**
 * @version    0.3.10
 * @date       2015-02-05
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */



var undef
, selectorRe = /([.#:[])([-\w]+)(?:\((.+?)\)|([~^$*|]?)=(("|')(?:\\?.)*?\6|[-\w]+))?]?/g
, selectorLastRe = /([\s>+]*)(?:("|')(?:\\?.)*?\2|\(.+?\)|[^\s+>])+$/
, selectorSplitRe = /\s*,\s*(?=(?:[^'"()]|"(?:\\?.)*?"|'(?:\\?.)*?'|\(.+?\))+$)/
, selectorCache = {}
, selectorMap = {
	"any": "_.matches(v)",
	"empty": "!_.hasChildNodes()",
	"enabled": "!_.getAttribute('disabled')",
	"first-child": "(a=_.parentNode)&&a.firstChild==_",
	"lang": "_.closest('[lang]').matches('[lang|='+v+']')",
	"last-child" : "(a=_.parentNode)&&a.lastChild==_",
	"link": "_.nodeName=='A'&&_.getAttribute('href')",
	"not": "!_.matches(v)",
	"nth-child": "((v=v.replace('odd','2n+1').replace('even','2n').split('n')),(a=1 in v?(b=v[1],v[0]):(b=v[0],0)),(v=_.parentNode.childNodes),(v=1+v.indexOf(_)),a==0?v==b:(a=='-'||(v-b)%a==0)&&(a>0||v<=b))",
	"only-child" : "(a=_.parentNode)&&a.firstChild==a.lastChild",
	"optional": "!_.getAttribute('required')",
	"root" : "(a=_.parentNode)&&!a.tagName",
	".": "~_.className.split(/\\s+/).indexOf(a)",
	"#": "_.id==a",
	"^": "a.indexOf(v)==0",
	"|": "a.split('-')[0]==v",
	"$": "a.slice(-v.length)==v",
	"~": "~a.split(/\\s+/).indexOf(v)",
	"*": "~a.indexOf(v)"
}

selectorMap["nth-last-child"] = selectorMap["nth-child"].replace("1+", "v.length-")

function selectorFn(str) {
	// jshint evil:true
	return selectorCache[str] ||
	(selectorCache[str] = Function("m,c,n,p", "return function(_,v,a,b){return " +
		str.split(selectorSplitRe).map(function(sel) {
			var relation, from
			, rules = ["_&&_.nodeType===1"]
			, parentSel = sel.replace(selectorLastRe, function(_, _rel, a, start) {
				from = start + _rel.length
				relation = _rel.trim()
				return ""
			})
			, tag = sel.slice(from).replace(selectorRe, function(_, op, key, subSel, fn, val, quotation) {
				rules.push(
					"((v='" +
					(subSel || (quotation ? val.slice(1, -1) : val) || "").replace(/'/g, "\\'") +
					"'),(a='" + key + "'),1)"
					,
					selectorMap[op == ":" ? key : op] ||
					"(a=_.getAttribute(a))" +
					(fn ? "&&" + selectorMap[fn] : val ? "==v" : "")
				)
				return ""
			})

			if (tag && tag != "*") rules[0] += "&&_.nodeName=='" + tag.toUpperCase() + "'"
			if (parentSel) rules.push(
				relation == "+" ? "(a=_.previousSibling)" : "(a=_.parentNode)",
				( relation ? "a.matches&&a.matches('" : "a.closest&&a.closest('" ) + parentSel + "')"
			)
			return rules.join("&&")
		}).join("||") + "}"
	)(matches, closest, next, prev))
}


function walk(next, el, sel, first, nextFn) {
	var out = []
	sel = selectorFn(sel)
	for (; el; el = el[next] || nextFn && nextFn(el)) if (sel(el)) {
		if (first) return el
		out.push(el)
	}
	return first ? null : out
}

function find(node, sel, first) {
	return walk("firstChild", node.firstChild, sel, first, function(el) {
		var next = el.nextSibling
		while (!next && ((el = el.parentNode) !== node)) next = el.nextSibling
		return next
	})
}

function matches(el, sel) {
	return !!selectorFn(sel)(el)
}

function closest(el, sel) {
	return walk("parentNode", el, sel, 1)
}

function next(el, sel) {
	return walk("nextSibling", el.nextSibling, sel, 1)
}

function prev(el, sel) {
	return walk("previousSibling", el.previousSibling, sel, 1)
}


this.find = find
this.fn = selectorFn
this.matches = matches
this.closest = closest
this.next = next
this.prev = prev
this.selectorMap = selectorMap


