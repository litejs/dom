

/**
 * @version    0.3.1
 * @date       2015-02-02
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */


var hasOwn = Object.prototype.hasOwnProperty

function extend(obj, _super, extras) {
	obj.prototype = Object.create(_super.prototype)
	for (var key in extras) {
		obj.prototype[key] = extras[key]
	}
	obj.prototype.constructor = obj
}

function StyleMap(style) {
	var styleMap = this
	if (style) style.split(/\s*;\s*/g).map(function(val) {
		val = val.split(/\s*:\s*/)
		if(val[1]) styleMap[val[0]] = val[1]
	})
}

StyleMap.prototype.valueOf = function() {
	var styleMap = this
	return Object.keys(styleMap).map(function(key) {
		return key + ": " + styleMap[key]
	}).join("; ")
}

function Node(){}

function getSibling(node, step) {
	var silbings = node.parentNode && node.parentNode.childNodes
	, index = silbings && silbings.indexOf(node)

	return silbings && index > -1 && silbings[ index + step ] || null
}

Node.prototype = {
	nodeName:        null,
	parentNode:      null,
	ownerDocument:   null,
	childNodes:      null,
	get nodeValue() {
		return this.nodeType === 3 || this.nodeType === 8 ? this.data : null
	},
	set nodeValue(text) {
		return this.nodeType === 3 || this.nodeType === 8 ? (this.data = text) : null
	},
	get textContent() {
		return this.hasChildNodes() ? this.childNodes.map(function(child) {
			return child[ child.nodeType == 3 ? "data" : "textContent" ]
		}).join("") : this.nodeType === 3 ? this.data : ""
	},
	set textContent(text) {
		if (this.nodeType === 3) return (this.data = text)
		for (var node = this; node.firstChild;) node.removeChild(node.firstChild)
		node.appendChild(node.ownerDocument.createTextNode(text))
	},
	get firstChild() {
		return this.childNodes && this.childNodes[0] || null
	},
	get lastChild() {
		return this.childNodes && this.childNodes[ this.childNodes.length - 1 ] || null
	},
	get previousSibling() {
		return getSibling(this, -1)
	},
	get nextSibling() {
		return getSibling(this, 1)
	},
	get innerHTML() {
		return Node.prototype.toString.call(this)
	},
	get outerHTML() {
		return this.toString()
	},
	get htmlFor() {
		return this["for"]
	},
	set htmlFor(value) {
		this["for"] = value
	},
	get className() {
		return this["class"] || ""
	},
	set className(value) {
		this["class"] = value
	},
	get style() {
		return this.styleMap || (this.styleMap = new StyleMap())
	},
	set style(value) {
		this.styleMap = new StyleMap(value)
	},
	hasChildNodes: function() {
		return this.childNodes && this.childNodes.length > 0
	},
	appendChild: function(el) {
		return this.insertBefore(el)
	},
	insertBefore: function(el, ref) {
		var node = this
		, childs = node.childNodes

		if (el.nodeType == 11) {
			while (el.firstChild) node.insertBefore(el.firstChild, ref)
		} else {
			if (el.parentNode) el.parentNode.removeChild(el)
			el.parentNode = node

			// If ref is null, insert el at the end of the list of children.
			childs.splice(ref ? childs.indexOf(ref) : childs.length, 0, el)
		}
		return el
	},
	removeChild: function(el) {
		var node = this
		, index = node.childNodes.indexOf(el)
		if (index == -1) throw new Error("NOT_FOUND_ERR")

		node.childNodes.splice(index, 1)
		el.parentNode = null
		return el
	},
	replaceChild: function(el, ref) {
		this.insertBefore(el, ref)
		return this.removeChild(ref)
	},
	cloneNode: function(deep) {
		var key
		, node = this
		, clone = new node.constructor(node.tagName || node.data)
		clone.ownerDocument = node.ownerDocument

		if (node.hasAttribute) {
			for (key in node) if (node.hasAttribute(key)) clone[key] = node[key].valueOf()
		}

		if (deep && node.hasChildNodes()) {
			node.childNodes.forEach(function(child) {
				clone.appendChild(child.cloneNode(deep))
			})
		}
		return clone
	},
	toString: function() {
		return this.hasChildNodes() ? this.childNodes.reduce(function(memo, node) {
			return memo + node
		}, "") : ""
	}
}


function DocumentFragment() {
	this.childNodes = []
}

extend(DocumentFragment, Node, {
	nodeType: 11,
	nodeName: "#document-fragment"
})

function Attribute(node, name) {
	this.name = name.toLowerCase()

	Object.defineProperty(this, "value", {
		get: function() {return node.getAttribute(name)},
		set: function(val) {node.setAttribute(name, val)}
	})
}
Attribute.prototype.toString = function() {
	if (!this.value) return this.name
	// jshint -W108
	return this.name + '="' + this.value.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"'
}

function HTMLElement(tag) {
	var element = this
	element.nodeName = element.tagName = tag.toUpperCase()
	element.localName = tag.toLowerCase()
	element.childNodes = []
}

function findEl(node, sel, first) {
	var el
	, i = 0
	, out = []
	, els = node.getElementsByTagName("*")
	, fn = selectorFn(sel.split(/\s*,\s*/).map(selectorFnStr).join("||"))

	for (; (el = els[i++]); ) if (fn(el)) {
		if (first) return el
		out.push(el)
	}
	return first ? null : out
}

/*
* Void elements:
* http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
*/
var voidElements = {
	AREA:1, BASE:1, BR:1, COL:1, EMBED:1, HR:1, IMG:1, INPUT:1,
	KEYGEN:1, LINK:1, MENUITEM:1, META:1, PARAM:1, SOURCE:1, TRACK:1, WBR:1
}
, pseudoClasses = {
	"empty": "!_.hasChildNodes()",
	"first-child": "_.parentNode&&_.parentNode.firstChild==_",
	"last-child" : "_.parentNode&&_.parentNode.lastChild==_",
	"link": "_.nodeName=='A'&&_.getAttribute('href')"
}
, selectorRe = /([.#:[])([-\w]+)(?:=((["'\/])(?:\\?.)*?\4|[-\w]+)]])?/g
, lastSelectorRe = /(\s*[>+]?\s*)((["'\/])(?:\\?.)*?\2|[^\s+>])+$/
, fnCache = {}

function escapeAttributeName(name) {
	name = name.toLowerCase()
	if (name === "constructor" || name === "attributes") return name.toUpperCase()
	return name
}

function selectorFnStr(sel) {
	var rules = ["_"]
	, tag = sel.replace(selectorRe, function(_, op, key, val, quotation) {
		if (quotation) val = val.slice(1, -1)
		rules.push(
			op == "." ? "(' '+_.className+' ').indexOf(' " + key + " ')>-1" :
			op == "#" ? "_.id=='" + key + "'" :
			op == ":" && pseudoClasses[key] ||
			"_.getAttribute('" + key + "')" + (val ? "=='" + val.replace(/'/g, "\\'") + "'" : "")
		)
		return ""
	})

	if (tag && tag != "*") rules.unshift("_.nodeName=='" + tag.toUpperCase() + "'")
	return rules.join("&&")
}

function selectorFn(str) {
	// jshint evil:true
	return fnCache[str] ||
	(fnCache[str] = Function("_", "return " + str))
}

extend(HTMLElement, Node, {
	matches: function(sel) {
		var relation, from
		, parentSel = sel.replace(lastSelectorRe, function(_, _rel, a, b, start) {
			from = start + _rel.length
			relation = _rel.trim()
			return ""
		})
		, next = relation == ">" ? this.parentNode : relation == "+" ? this.previousSibling : this
		, fn = selectorFn(selectorFnStr(sel.slice(from)))

		if (!fn(this)) return false

		if (parentSel) {
			if (!relation) return !!(next.parentNode && next.parentNode.closest && next.parentNode.closest(parentSel))
			return next && next.matches && next.matches(parentSel) || false
		}
		return true
	},
	closest: function(sel) {
		for (var el = this; el; el = el.parentNode) if (el.matches && el.matches(sel)) return el
		return null
	},
	namespaceURI: "http://www.w3.org/1999/xhtml",
	nodeType: 1,
	localName: null,
	tagName: null,
	styleMap: null,
	hasAttribute: function(name) {
		name = escapeAttributeName(name)
		return name == "style" && !!this.style.valueOf() || hasOwn.call(this, name)
	},
	getAttribute: function(name) {
		name = escapeAttributeName(name)
		return this.hasAttribute(name) ? "" + this[name] : null
	},
	setAttribute: function(name, value) {
		name = escapeAttributeName(name)
		this[name] = "" + value
	},
	removeAttribute: function(name) {
		name = escapeAttributeName(name)
		this[name] = ""
		delete this[name]
	},
	getElementById: function(id) {
		if (this.id == id) return this
		for (var el, found, i = 0; !found && (el = this.childNodes[i++]);) {
			if (el.nodeType == 1) found = el.getElementById(id)
		}
		return found || null
	},
	getElementsByTagName: function(tag) {
		var el, els = [], next = this.firstChild
		tag = tag === "*" ? 1 : tag.toUpperCase()
		for (var i = 0, key = tag === 1 ? "nodeType" : "nodeName"; (el = next); ) {
			if (el[key] === tag) els[i++] = el
			next = el.firstChild || el.nextSibling
			while (!next && ((el = el.parentNode) !== this)) next = el.nextSibling
		}
		return els
	},
	querySelector: function(sel) {
		return findEl(this, sel, 1)
	},
	querySelectorAll: function(sel) {
		return findEl(this, sel)
	},
	toString: function() {
		var attrs = this.attributes.join(" ")
		return "<" + this.localName + (attrs ? " " + attrs : "") + ">" +
		(voidElements[this.tagName] ? "" : this.innerHTML + "</" + this.localName + ">")
	}
})

Object.defineProperty(HTMLElement.prototype, "attributes", {
	get: function() {
		var key
		, attrs = []
		, element = this
		for (key in element) if (key === escapeAttributeName(key) && element.hasAttribute(key))
			attrs.push(new Attribute(element, escapeAttributeName(key)))
		return attrs
	}
})

function ElementNS(namespace, tag) {
	var element = this
	element.namespaceURI = namespace
	element.nodeName = element.tagName = element.localName = tag
	element.childNodes = []
}

ElementNS.prototype = HTMLElement.prototype

function Text(data) {
	this.data = data
}

extend(Text, Node, {
	nodeType: 3,
	nodeName: "#text",
	toString: function() {
		return ("" + this.data).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
	}
})

function Comment(data) {
	this.data = data
}

extend(Comment, Node, {
	nodeType: 8,
	nodeName: "#comment",
	toString: function() {
		return "<!--" + this.data + "-->"
	}
})

function Document() {
	this.childNodes = []
	this.documentElement = this.createElement("html")
	this.appendChild(this.documentElement)
	this.body = this.createElement("body")
	this.documentElement.appendChild(this.body)
}

function own(Element) {
	return function($1, $2) {
		var node = new Element($1, $2)
		node.ownerDocument = this
		return node
	}
}

extend(Document, Node, {
	nodeType: 9,
	nodeName: "#document",
	createElement: own(HTMLElement),
	createElementNS: own(ElementNS),
	createTextNode: own(Text),
	createComment: own(Comment),
	createDocumentFragment: own(DocumentFragment),
	getElementById: HTMLElement.prototype.getElementById,
	getElementsByTagName: HTMLElement.prototype.getElementsByTagName,
	querySelector: HTMLElement.prototype.querySelector,
	querySelectorAll: HTMLElement.prototype.querySelectorAll
})

module.exports = {
	document: new Document(),
	Document: Document,
	HTMLElement: HTMLElement
}

