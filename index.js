

/**
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */


var boolAttrs = {
	async:1, autoplay:1, loop:1, checked:1, defer:1, disabled:1, muted:1, multiple:1, nomodule:1, playsinline:1, readonly:1, required:1, selected:1
}
, defaultAttrs = {
	"form method get":1, "input type text":1,
	"script type text/javascript":1, "style type text/css": 1
}
, voidElements = {
	AREA:1, BASE:1, BR:1, COL:1, EMBED:1, HR:1, IMG:1, INPUT:1, KEYGEN:1, LINK:1, MENUITEM:1, META:1, PARAM:1, SOURCE:1, TRACK:1, WBR:1
}
, hasOwn = voidElements.hasOwnProperty
, selector = require("./selector.js")
, Node = {
	ELEMENT_NODE:                1,
	TEXT_NODE:                   3,
	PROCESSING_INSTRUCTION_NODE: 7,
	COMMENT_NODE:                8,
	DOCUMENT_NODE:               9,
	DOCUMENT_TYPE_NODE:         10,
	DOCUMENT_FRAGMENT_NODE:     11,
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
			return child[ child.nodeType === 3 ? "data" : "textContent" ]
		}).join("") : this.nodeType === 3 ? this.data : ""
	},
	set textContent(text) {
		if (this.nodeType === 3) return (this.data = text)
		for (var node = this; node.firstChild; ) node.removeChild(node.firstChild)
		node.appendChild(node.ownerDocument.createTextNode(text))
	},
	get firstChild() {
		return this.childNodes && this.childNodes[0] || null
	},
	get lastChild() {
		return this.childNodes && this.childNodes[ this.childNodes.length - 1 ] || null
	},
	get nextSibling() {
		return getSibling(this, 1, 0)
	},
	get previousSibling() {
		return getSibling(this, -1, 0)
	},
	// innerHTML and outerHTML should be extensions to the Element interface
	get innerHTML() {
		return Node.toString.call(this)
	},
	set innerHTML(html) {
		var match, child
		, node = this
		, doc = node.ownerDocument || node
		, tagRe = /<(!--([\s\S]*?)--!?|!\[[\s\S]*?\]|[?!][\s\S]*?)>|<(\/?)([^ \/>]+)((?:("|')(?:\\\6|[\s\S])*?\6|[^>])*?)(\/?)>|[^<]+/g
		, attrRe = /([^= ]+)(?:\s*=\s*(("|')((?:\\\3|[\s\S])*?)\3|[^\s"'`=<>]+)|)/g
		, frag = doc.createDocumentFragment()
		, tree = frag

		for (; node.firstChild; ) node.removeChild(node.firstChild)

		for (; (match = tagRe.exec(html)); ) {
			if (match[3]) {
				tree = tree.parentNode || tree
			} else if (match[4]) {
				child = doc.contentType === "text/html" ? doc.createElement(match[4]) : doc.createElementNS(null, match[4])
				if (match[5]) {
					match[5].replace(attrRe, setAttr)
				}
				tree.appendChild(child)
				if (!voidElements[child.tagName] && !match[7]) tree = child
			} else {
				tree.appendChild(
					match[2] ? doc.createComment(match[2].replace(unescRe, unescFn)) :
					match[1] ? doc.createDocumentType(match[1]) :
					doc.createTextNode(match[0].replace(unescRe, unescFn))
				)
			}
		}
		node.appendChild(frag)

		return html

		function setAttr(_, name, value, q, qvalue) {
			child.setAttribute(name, (q ? qvalue : value || "").replace(unescRe, unescFn))
		}
	},
	get outerHTML() {
		return this.toString()
	},
	set outerHTML(html) {
		var frag = this.ownerDocument.createDocumentFragment()
		frag.innerHTML = html
		this.parentNode.replaceChild(frag, this)
		return html
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
	contains: function (targetNode) {
		for (; targetNode; targetNode = targetNode.parentNode) {
			if (targetNode === this) return true
		}
		return false
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

		if (el.nodeType === 11) {
			for (; el.firstChild; ) node.insertBefore(el.firstChild, ref)
		} else {
			if (el.parentNode) el.parentNode.removeChild(el)
			el.parentNode = node

			// If ref is null, insert el at the end of the list of children.
			childs.splice(ref ? childs.indexOf(ref) : childs.length, 0, el)
			if (node.nodeType === 9 && el.nodeType === 1) {
				node.documentElement = el
				node.body = el.querySelector("body")
			}
		}
		return el
	},
	removeChild: function(el) {
		var node = this
		, index = node.childNodes.indexOf(el)
		if (index === -1) throw Error("NOT_FOUND_ERR")

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
	toString: function(minify) {
		return this.hasChildNodes() ? this.childNodes.reduce(function(memo, node) {
			return memo + node.toString(minify)
		}, "") : ""
	}
}
, Element = {
	get firstElementChild() {
		return getElement(this.childNodes, 0, 1, 1)
	},
	get lastElementChild() {
		return getElement(this.childNodes, this.childNodes.length - 1, -1, 1)
	},
	get nextElementSibling() {
		return getSibling(this, 1, 1)
	},
	get previousElementSibling() {
		return getSibling(this, -1, 1)
	},
	hasAttribute: function(name) {
		name = escapeAttributeName(name)
		return name !== "style" ? hasOwn.call(this, name) :
		!!(this.styleMap && Object.keys(this.styleMap).length)
	},
	getAttribute: function(name) {
		name = escapeAttributeName(name)
		return this.hasAttribute(name) ? "" + this[name] : null
	},
	setAttribute: function(name, value) {
		this[escapeAttributeName(name)] = "" + value
	},
	removeAttribute: function(name) {
		name = escapeAttributeName(name)
		this[name] = ""
		delete this[name]
	},
	getElementById: function(id) {
		return selector.find(this, "#" + id, 1)
	},
	getElementsByTagName: function(tag) {
		return selector.find(this, tag)
	},
	getElementsByClassName: function(sel) {
		return selector.find(this, "." + sel.replace(/\s+/g, "."))
	},
	querySelector: function(sel) {
		return selector.find(this, sel, 1)
	},
	querySelectorAll: function(sel) {
		return selector.find(this, sel)
	}
}
, quotedAttrRe = /[\s"'`=<>]/
, escRe = /<|&(?=[a-z#])/gi
, unescRe = /&\w+;|&#(x|)([\da-f]+);/ig
, unescMap = {
	"&amp;": "&", "&apos;": "'", "&cent;": "¢", "&copy;": "©", "&curren;": "¤",
	"&deg;": "°", "&euro;": "€", "&gt;": ">", "&lt;": "<", "&nbsp;": " ",
	"&plusmn;": "±", "&pound;": "£", "&quot;": "\"", "&reg;": "®",
	"&sect;": "§", "&sup2;": "²", "&sup3;": "³", "&yen;": "¥"
}

function escFn(chr) {
	return chr === "<" ? "&lt;" : "&amp;"
}

function unescFn(ent, hex, num) {
	return num ? String.fromCharCode(parseInt(num, hex === "" ? 10 : 16)) : unescMap[ent] || ent
}

;["hasAttribute", "getAttribute", "setAttribute", "removeAttribute"].forEach(function(name) {
	Element[name + "NS"] = function(ns, a, b) {
		return this[name].call(this, a, b)
	}
})

function Attr(node, name) {
	this.ownerElement = node
	this.name = name.toLowerCase()
}

Attr.prototype = {
	get value() { return this.ownerElement.getAttribute(this.name) },
	set value(val) { this.ownerElement.setAttribute(this.name, val) },
	toString: function(minify) {
		var value = this.value.replace(escRe, escFn)
		if (this.ownerElement.ownerDocument.contentType !== "application/xml") {
			if (hasOwn.call(boolAttrs, this.name)) return this.name
			if (minify) {
				if (hasOwn.call(defaultAttrs, (this.ownerElement.tagName + " " + this.name + " " + value).toLowerCase())) return
				if (!quotedAttrRe.test(value)) return this.name + "=" + this.value
				if (value.split("\"").length > value.split("'").length) return this.name + "='" + value.replace(/'/g, "&#39;") + "'"
			}
		}
		return this.name + "=\"" + value.replace(/"/g, "&quot;") + "\""
	}
}

function StyleMap(style) {
	if (style) style.split(/\b\s*;\s*/g).forEach(function(val) {
		val = val.split(/\b\s*:\s*/)
		if (val[1]) this[val[0] === "float" ? "cssFloat" : camelCase(val[0])] = val[1]
	}, this)
}

StyleMap.prototype.valueOf = function() {
	return Object.keys(this).map(function(key) {
		return (key === "cssFloat" ? "float:" : hyphenCase(key) + ":") + this[key]
	}, this).join(";")
}

function DocumentFragment() {
	this.childNodes = []
}

extendNode(DocumentFragment, Element, {
	nodeType: 11,
	nodeName: "#document-fragment"
})

function HTMLElement(tag) {
	var el = this
	el.nodeName = el.tagName = tag.toUpperCase()
	el.localName = tag.toLowerCase()
	el.childNodes = []
}

extendNode(HTMLElement, Element, {
	nodeType: 1,
	get attributes() {
		var key
		, attrs = []
		, el = this
		for (key in el) if (key === escapeAttributeName(key) && el.hasAttribute(key))
			attrs.push(new Attr(el, escapeAttributeName(key)))
		return attrs
	},
	matches: function(sel) {
		return selector.matches(this, sel)
	},
	closest: function(sel) {
		return selector.closest(this, sel)
	},
	namespaceURI: "http://www.w3.org/1999/xhtml",
	localName: null,
	tagName: null,
	styleMap: null,
	toString: function(minify) {
		var attrs = (minify ? this.attributes.map(toMinString).filter(Boolean) : this.attributes).join(" ")
		return "<" + this.localName + (attrs ? " " + attrs + (attrs.slice(-1) === "/" ? " >" : ">") : ">") +
		(voidElements[this.tagName] ? "" : Node.toString.call(this, minify) + "</" + this.localName + ">")
	}
})

function ElementNS(namespace, tag) {
	var el = this
	el.namespaceURI = namespace
	el.nodeName = el.tagName = el.localName = tag
	el.childNodes = []
}

ElementNS.prototype = HTMLElement.prototype

function Text(data) {
	this.data = data
}

extendNode(Text, {
	nodeType: 3,
	nodeName: "#text",
	toString: function(minify) {
		return (minify ? ("" + this.data).trim() : "" + this.data).replace(escRe, escFn)
	}
})

function Comment(data) {
	this.data = data
}

extendNode(Comment, {
	nodeType: 8,
	nodeName: "#comment",
	toString: function(minify) {
		return minify ? "" : "<!--" + this.data + "-->"
	}
})

function DocumentType(data) {
	this.data = data
}

extendNode(DocumentType, {
	nodeType: 10,
	toString: function() {
		return "<" + this.data + ">"
		// var node = document.doctype
		// return "<!DOCTYPE " + node.name +
		// 	(node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') +
		// 	(!node.publicId && node.systemId ? ' SYSTEM' : '') +
		// 	(node.systemId ? ' "' + node.systemId + '"' : '') + '>'
	}
})

function Document() {
	this.childNodes = []
	this
	.appendChild(this.createElement("html"))
	.appendChild(this.body = this.createElement("body"))
}

extendNode(Document, Element, {
	nodeType: 9,
	nodeName: "#document",
	contentType: "text/html",
	createElement: own(HTMLElement),
	createElementNS: own(ElementNS),
	createTextNode: own(Text),
	createComment: own(Comment),
	createDocumentType: own(DocumentType), //Should be document.implementation.createDocumentType(name, publicId, systemId)
	createDocumentFragment: own(DocumentFragment)
})

function DOMParser() {}
function XMLSerializer() {}

DOMParser.prototype.parseFromString = function(str, mime) {
	var doc = new Document()
	doc.contentType = mime || "text/html"
	doc.documentElement.outerHTML = str
	return doc
}
XMLSerializer.prototype.serializeToString = function(doc) {
	return doc.toString()
}


function own(Class) {
	return function($1, $2) {
		var node = new Class($1, $2)
		node.ownerDocument = this
		return node
	}
}

function extendNode(obj, extras) {
	obj.prototype = Object.create(Node)
	for (var descriptor, key, i = 1; (extras = arguments[i++]); ) {
		for (key in extras) {
			descriptor = Object.getOwnPropertyDescriptor(extras, key)
			Object.defineProperty(obj.prototype, key, descriptor)
		}
	}
	obj.prototype.constructor = obj
}

function getElement(childs, index, step, type) {
	if (childs && index > -1) for (; childs[index]; index += step) {
		if (childs[index].nodeType === type) return childs[index]
	}
	return null
}

function getSibling(node, step, type) {
	var silbings = node.parentNode && node.parentNode.childNodes
	, index = silbings ? silbings.indexOf(node) : -1
	return type > 0 ? getElement(silbings, index + step, step, type) : silbings[index + step] || null
}

function escapeAttributeName(name) {
	name = name.toLowerCase()
	if (name === "constructor" || name === "attributes") return name.toUpperCase()
	return name
}

function camelCase(str) {
	return str.replace(/-([a-z])/g, function(_, a) { return a.toUpperCase() })
}

function hyphenCase(str) {
	return str.replace(/[A-Z]/g, "-$&").toLowerCase()
}

function toMinString(item) {
	return item.toString(true)
}

module.exports = {
	document: new Document(),
	DOMParser: DOMParser,
	XMLSerializer: XMLSerializer,
	StyleMap: StyleMap,
	Node: Node,
	HTMLElement: HTMLElement,
	DocumentFragment: DocumentFragment,
	Document: Document
}

