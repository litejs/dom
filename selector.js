

/**
 * @version    0.3.10
 * @date       2015-02-05
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */



var undef
, selectorRe = /([.#:[])([-\w]+)(?:\(([^)]+)\))?(?:([~^$*|]?)=(("|')(?:\\?.)*?\6|[-\w]+)])?]?/g
, selectorLastRe = /(\s*[>+]?\s*)(?:("|')(?:\\?.)*?\2|\([^\)]+\)|[^\s+>])+$/
, selectorSplitRe = /\s*,\s*(?=(?:[^'"()]|"(?:\\?.)*?"|'(?:\\?.)*?'|\(.+?\))*$)/
, selectorCache = {}
, selectorMap = {
	"any": "_.matches(v)",
	"empty": "!_.hasChildNodes()",
	"enabled": "!_.getAttribute('disabled')",
	"first-child": "_.parentNode&&_.parentNode.firstChild==_",
	"last-child" : "_.parentNode&&_.parentNode.lastChild==_",
	"link": "_.nodeName=='A'&&_.getAttribute('href')",
	"not": "!_.matches(v)",
	"nth-child": "((v=v.split('n')),(a=1 in v?(b=v[1],v[0]):(b=v[0],0)),(v=_.parentNode.childNodes.indexOf(_)+1),a==0?v==b:a=='-'?v<=b:(v-b)%a==0)",
	"only-child" : "_.parentNode&&_.parentNode.firstChild==_&&_.parentNode.lastChild==_",
	"optional": "!_.getAttribute('required')",
	"root" : "_.parentNode&&!_.parentNode.tagName",
	".": "_.className.split(/\\s+/).indexOf(a)>-1",
	"#": "_.id==a",
	"^": "a.slice(0,b)==v",
	"|": "a.split('-')[0]==v",
	"$": "a.slice(-b)==v",
	"~": "a.split(/\\s+/).indexOf(v)>-1",
	"*": "a.indexOf(v)>-1"
}

function findEl(node, sel, first) {
	var el
	, i = 0
	, out = []
	, next = node.firstChild
	, fn = selectorFn(sel)

	for (; (el = next); ) {
		if (fn(el)) {
			if (first) return el
			out.push(el)
		}
		next = el.firstChild || el.nextSibling
		while (!next && ((el = el.parentNode) !== node)) next = el.nextSibling
	}
	return first ? null : out
}

function selectorFn(str) {
	// jshint evil:true
	return selectorCache[str] ||
	(selectorCache[str] = Function("_,v,a,b", "return " +
		str.split(selectorSplitRe).map(function(sel) {
			var relation, from
			, rules = ["_&&_.nodeType===1"]
			, parentSel = sel.replace(selectorLastRe, function(_, _rel, a, start) {
				from = start + _rel.length
				relation = _rel.trim()
				return ""
			})
			, tag = sel.slice(from).replace(selectorRe, function(_, op, key, subSel, fn, val, quotation, len) {
				if (val) {
					if (quotation) val = val.slice(1, -1)
					len = val.length
					val = val.replace(/'/g, "\\'")
				}
				rules.push(
					"((v='"+(subSel||val)+"'),(a='"+key+"'),1)",
					selectorMap[op == ":" ? key : op] ||
					"(a=_.getAttribute(a))" +
					(fn ? "&&(b="+len+")&&"+ selectorMap[fn] : val ? "==v" : "")
				)
				return ""
			})

			if (tag && tag != "*") rules.splice(1, 0, "_.nodeName=='" + tag.toUpperCase() + "'")
			if (parentSel) rules.push(
				relation == "+" ? "(a=_.previousSibling)" : "(a=_.parentNode)",
				( relation ? "a.matches&&a.matches('" : "a.closest&&a.closest('" ) + parentSel + "')"
			)
			return rules.join("&&")
		}).join("||")
	))
}


this.find = findEl
this.fn = selectorFn


