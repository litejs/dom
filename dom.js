
/*! litejs.com/MIT-LICENSE.txt */

"use strict"

var numAttrs = "height size tabIndex width"
, numAttrsNeg = "maxLength minLength"
, strAttrs = "accept accesskey autocapitalize autofocus capture class contenteditable crossorigin dir for hidden href id integrity lang name nonce rel slot spellcheck src title type translate"
, listeners = new WeakMap()
, rawTextEscape = { SCRIPT: /<(?=\/script|!--)/ig, STYLE: /<(?=\/style|!--)/ig }
, { CSS, CSSStyleDeclaration, CSSStyleSheet } = require("./css.js")
, { stringify, boolAttrs, voidElements, svgVoidElements, rawTextElements } = require("./stringify.js")
, selector = require("./selector.js")
, Node = {
	ELEMENT_NODE:                1,
	TEXT_NODE:                   3,
	PROCESSING_INSTRUCTION_NODE: 7,
	COMMENT_NODE:                8,
	DOCUMENT_NODE:               9,
	DOCUMENT_TYPE_NODE:         10,
	DOCUMENT_FRAGMENT_NODE:     11,
	DOCUMENT_POSITION_DISCONNECTED: 1,
	DOCUMENT_POSITION_PRECEDING: 2,
	DOCUMENT_POSITION_FOLLOWING: 4,
	DOCUMENT_POSITION_CONTAINS: 8,
	DOCUMENT_POSITION_CONTAINED_BY: 16,
	DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32,
	nodeName:        null,
	parentNode:      null,
	ownerDocument:   null,
	childNodes:      null,
	get nodeValue() {
		return this.nodeType === 3 || this.nodeType === 8 ? this.data : null
	},
	set nodeValue(text) {
		if (this.nodeType === 3 || this.nodeType === 8) this.data = text
	},
	get textContent() {
		return this.nodeType === 3 || this.nodeType === 8 ? this.data : this.childNodes.map(node => node.textContent).join("")
	},
	set textContent(text) {
		if (this.nodeType === 3 || this.nodeType === 8) this.data = text
		else {
			removeChilds(this)
			this.appendChild(this.ownerDocument.createTextNode(
				rawTextEscape[this.tagName] ? text.replace(rawTextEscape[this.tagName], "<\\") : text
			))
		}
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
	appendChild(el) {
		return this.insertBefore(el)
	},
	cloneNode(deep) {
		var node = this
		, clone = new node.constructor(node.tagName || node.data)
		clone.ownerDocument = node.ownerDocument

		mergeAttributes(node, clone)

		if (deep && node.hasChildNodes()) {
			node.childNodes.forEach(child => clone.appendChild(child.cloneNode(deep)))
		}
		return clone
	},
	compareDocumentPosition(other) {
		var node = this
		if (node === other) return 0
		if (node.getRootNode() !== other.getRootNode()) return Node.DOCUMENT_POSITION_DISCONNECTED
		if (node.contains(other)) return Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING
		if (other.contains(node)) return Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING

		for (; node; node = node.nextSibling || node.parentNode && node.parentNode.nextSibling) {
			if (node === other) return Node.DOCUMENT_POSITION_FOLLOWING
		}
		return Node.DOCUMENT_POSITION_PRECEDING
	},
	contains(el) {
		for (; el; el = el.parentNode) if (el === this) return true
		return false
	},
	getRootNode() {
		for (var node = this; node.parentNode; ) node = node.parentNode
		return node
	},
	hasChildNodes() {
		return !!this.firstChild
	},
	insertBefore(el, ref) {
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
	removeChild(el) {
		var node = this
		, index = node.childNodes.indexOf(el)
		if (index === -1) throw Error("NOT_FOUND_ERR")

		node.childNodes.splice(index, 1)
		el.parentNode = null
		return el
	},
	replaceChild(el, ref) {
		this.insertBefore(el, ref)
		return this.removeChild(ref)
	},
	querySelector(sel) {
		return selector.find(this, sel, 1)
	},
	querySelectorAll(sel) {
		return selector.find(this, sel)
	},
	toString(min) {
		return stringify(this, min)
	},
	toJSON() {
		var node = this
		, json = {
			name: node.nodeName
		}
		if (node.nodeType === 1) {
			json.attributes = {}
			for (var a = 0; a < node.attributes.length; a++) json.attributes[node.attributes[a].name] = node.attributes[a].value
		}
		if (node.nodeType === 1 || node.nodeType === 9) {
			json.children = node.childNodes.map(child => child.toJSON())
		} else {
			json.data = node.data
		}
		return json
	}
}
, Element = {
	get children() {
		return this.childNodes.filter(node => node.nodeType === 1)
	},
	get firstElementChild() {
		return getElement(this.childNodes, 0, 1)
	},
	get lastElementChild() {
		return getElement(this.childNodes, this.childNodes.length - 1, -1)
	},
	get nextElementSibling() {
		return getSibling(this, 1, 1)
	},
	get previousElementSibling() {
		return getSibling(this, -1, 1)
	},
	get innerHTML() {
		return stringify(this, null, true)
	},
	set innerHTML(html) {
		var child, m, re, text
		, node = this
		, doc = node.ownerDocument || node
		, tagRe = /<(!--([\s\S]*?)--!?|!\[CDATA\[([\s\S]*?)\]\]|[?!][\s\S]*?)>|<(\/?)([^ \/>]+)((?:("|')(?:\\\7|[\s\S])*?\7|[^>])*?)(\/?)>|[^<]+|</g
		, attrRe = /([^=\s]+)(?:\s*=\s*(("|')((?:\\\3|[\s\S])*?)\3|[^\s"'`=<>]+)|)/g
		, frag = doc.createDocumentFragment()
		, tree = frag
		, voidEl = (doc.documentElement || 0).tagName === "svg" ? svgVoidElements : voidElements

		for (; (m = tagRe.exec(html)); ) {
			if (m[4]) {
				tree = tree.parentNode || tree
			} else if (m[5]) {
				child = doc.contentType === "text/html" ? doc.createElement(m[5]) : doc.createElementNS(null, m[5])
				if (m[6]) {
					m[6].replace(attrRe, setAttr)
				}
				tree.appendChild(child)
				if ((re = rawTextElements[child.tagName])) {
					for (text = ""; (m = tagRe.exec(html)) && !re.test(m[0]); text += m[3] || m[0]);
					child.textContent = text.replace(unescRe, unescFn)
					if (!m) break
				} else if (!voidEl[child.tagName] && !m[8]) tree = child
			} else {
				tree.appendChild(
					m[2] ? doc.createComment(m[2].replace(unescRe, unescFn)) :
					m[1] ? doc.implementation.createDocumentType(m[1]) :
					doc.createTextNode(m[0].replace(unescRe, unescFn))
				)
			}
		}
		node.replaceChildren(frag)

		function setAttr(_, name, value, q, qvalue) {
			child.setAttribute(name, (q ? qvalue : value || "").replace(unescRe, unescFn))
		}
	},
	get outerHTML() {
		return stringify(this)
	},
	set outerHTML(html) {
		var tmp = this.ownerDocument.createElement("div")
		, frag = this.ownerDocument.createDocumentFragment()
		tmp.innerHTML = html
		frag.childNodes = tmp.childNodes
		this.parentNode.replaceChild(frag, this)
	},
	replaceChildren() {
		removeChilds(this)
		for (var i = 0, l = arguments.length; i < l; ) this.insertBefore(arguments[i++])
	},
	hasAttribute(name) {
		return this.attributes.getNamedItem(name) != null
	},
	getAttribute(name) {
		var attr = this.attributes.getNamedItem(name)
		return attr ? attr.value : null
	},
	setAttribute(name, value) {
		this.attributes.setNamedItem(new Attr(this, name, value))
	},
	removeAttribute(name) {
		this.attributes.removeNamedItem(name)
	},
	getElementsByTagName(tag) {
		return selector.find(this, tag)
	},
	getElementsByClassName(sel) {
		return selector.find(this, "." + sel.replace(/\s+/g, "."))
	}
}
, unescRe = /&[a-z]{1,31};?|&#(x|)([\da-f]+);/ig
, unescFn = (ent, hex, num) => num ? String.fromCharCode(parseInt(num, hex === "" ? 10 : 16)) : entities[ent] || ent
, entities = {
	"&amp;": "&", "&apos;": "'", "&cent;": "¢", "&copy;": "©", "&curren;": "¤",
	"&deg;": "°", "&euro;": "€", "&gt;": ">", "&lt;": "<", "&nbsp;": " ",
	"&plusmn;": "±", "&pound;": "£", "&quot;": "\"", "&reg;": "®",
	"&sect;": "§", "&sup2;": "²", "&sup3;": "³", "&yen;": "¥"
}

Object.keys(boolAttrs).forEach(key => addGetter(key, { isBool: true, isDirty: boolAttrs[key] > 1, readonly: "readOnly" }))
numAttrs.split(" ").forEach(key => addGetter(key, { isNum: true }))
numAttrsNeg.split(" ").forEach(key => addGetter(key, { isNum: true, numDefault: -1 }))
strAttrs.split(" ").forEach(key => addGetter(key, { "for": "htmlFor", "class": "className" }))

function addGetter(key, opts) {
	var attr = key.toLowerCase()
	Object.defineProperty(Element, opts[key] || key, {
		configurable: true,
		enumerable: true,
		get: (
			opts.isDirty ? function() { return "_" + attr in this ? this["_" + attr] : this.hasAttribute(attr) } :
			opts.isBool ? function() { return this.hasAttribute(attr) } :
			opts.isNum ? function() { var v = this.getAttribute(attr); return v != null ? (+v || 0) : (opts.numDefault || 0) } :
			function() { return this.getAttribute(attr) || "" }
		),
		set(value) {
			if (opts.isDirty) this["_" + attr] = !!value
			else if (opts.isBool && !value) this.removeAttribute(attr)
			else this.setAttribute(attr, value)
		}
	})
}

;["hasAttribute", "getAttribute", "setAttribute", "removeAttribute"].forEach(name => {
	Element[name + "NS"] = function(ns, a, b) {
		if (name !== "setAttribute" && ns) {
			var lo = (":" + a).toLowerCase()
			for (var i = 0; i < this.attributes.length; i++) {
				if (this.attributes[i].name.toLowerCase().endsWith(lo)) return this[name](this.attributes[i].name)
			}
		}
		return this[name](a, b)
	}
})

function Attr(node, name, value) {
	this.ownerElement = node
	this.name = name
	this.value = "" + value
}

function Event(type, opts) {
	Object.assign(this, {type, bubbles: false, cancelable: false, defaultPrevented: false}, opts)
}
Event.prototype = {
	stopPropagation() {
		this.bubbles = false
	},
	preventDefault() {
		if (this.cancelable) this.defaultPrevented = true
	}
}

function NamedNodeMap(node) {
	Object.defineProperties(this, {
		_length: { value: 0, writable: true },
		_map: { value: Object.create(null) },
		ownerElement: { value: node }
	})
}

NamedNodeMap.prototype = {
	get length() {
		if (this.ownerElement._style) this.getNamedItem("style")
		return this._length
	},
	getNamedItem(name) {
		var loName = name.toLowerCase()
		, i = this._map[loName]
		if (loName === "style" && this.ownerElement._style) {
			if (i == null) {
				this[i = this._map[loName] = this._length++] = new Attr(this.ownerElement, name, "")
			}
			this[i].value = this.ownerElement._style.cssText
		}
		return i != null ? this[i] : null
	},
	removeNamedItem(name) {
		var loName = name.toLowerCase()
		, i = this._map[loName]
		, attr = i != null ? this[i] : null
		if (loName === "style") this.ownerElement._style = null
		if (i != null) {
			for (; i < this._length - 1; i++) {
				this[i] = this[i + 1]
				this._map[this[i].name.toLowerCase()] = i
			}
			this._map[loName] = this[--this._length] = null
		}
		return attr
	},
	setNamedItem(attr) {
		var loName = attr.name.toLowerCase()
		, oldAttr = null
		, i = this._map[loName]
		this[i == null ? this._map[loName] = this._length++ : (oldAttr = this[i], i)] = attr
		return oldAttr
	}
}

function DocumentFragment() {
	this.childNodes = []
}

extendNode(DocumentFragment, Node, {
	nodeType: 11,
	nodeName: "#document-fragment"
})

function HTMLElement(tag) {
	var el = this
	el.attributes = new NamedNodeMap(el)
	el.childNodes = []
	el.localName = tag.toLowerCase()
	el.nodeName = el.tagName = tag.toUpperCase()
}

extendNode(HTMLElement, Element, {
	localName: null,
	namespaceURI: "http://www.w3.org/1999/xhtml",
	nodeType: 1,
	tagName: null,
	get elements() {
		return this.tagName === "FORM" ? selector.find(this, "input,select,textarea,button") : undefined
	},
	get labels() {
		if (!selector.matches(this, "input,select,textarea,button")) return
		var labels = this.id ? selector.find(this.ownerDocument, "label[for='" + this.id + "']") : []
		, parent = selector.closest(this, "label")
		if (parent && labels.indexOf(parent) < 0) labels.push(parent)
		return labels
	},
	get style() {
		return this._style || (this._style = CSSStyleDeclaration(this.getAttribute("style") || ""))
	},
	set style(value) {
		this.style.cssText = value
	},
	get sheet() {
		var el = this
		if (el.tagName === "STYLE" || el.tagName === "LINK" && el.rel === "stylesheet" && el.href) return new CSSStyleSheet({
			href: el.href,
			ownerNode: el
		}, el.tagName === "STYLE" && el.textContent)
	},
	blur() {
		this.ownerDocument.activeElement = this.ownerDocument.body || null
	},
	click() {
		this.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }))
	},
	closest(sel) {
		return selector.closest(this, sel)
	},
	addEventListener(type, fn) {
		var map = listeners.get(this)
		if (!map) listeners.set(this, map = {})
		;(map[type] || (map[type] = [])).push(fn)
	},
	dispatchEvent(ev) {
		if (!ev.target) ev.target = this
		var fns = (listeners.get(this) || {})[ev.type]
		if (fns) fns.forEach(function(fn) { fn.call(this, ev) }, this)
		if (ev.bubbles && this.parentNode && this.parentNode.dispatchEvent) {
			this.parentNode.dispatchEvent(ev)
		}
	},
	removeEventListener(type, fn) {
		var fns = (listeners.get(this) || {})[type]
		, i = fns ? fns.indexOf(fn) : -1
		if (i > -1) fns.splice(i, 1)
	},
	focus() {
		this.ownerDocument.activeElement = this
	},
	matches(sel) {
		return selector.matches(this, sel)
	}
})

function ElementNS(namespace, tag) {
	var el = this
	el.attributes = new NamedNodeMap(el)
	el.childNodes = []
	el.namespaceURI = namespace
	el.nodeName = el.tagName = el.localName = tag
}

ElementNS.prototype = HTMLElement.prototype

function Text(data) {
	this.data = "" + data
}

extendNode(Text, {
	nodeType: 3,
	nodeName: "#text"
})

function Comment(data) {
	this.data = data
}

extendNode(Comment, {
	nodeType: 8,
	nodeName: "#comment"
})

function DocumentType(data) {
	this.data = data
}

extendNode(DocumentType, {
	nodeType: 10
})

function Document() {
	this.childNodes = []
	this.attributes = new NamedNodeMap(this)
}

extendNode(Document, Element, {
	get styleSheets() {
		return selector.find(this, "style,link[rel=stylesheet][href]").map(el => el.sheet)
	},
	get title() {
		var el = selector.find(this, "title", 1)
		return el && el.textContent || ""
	},
	set title(text) {
		var el = selector.find(this, "title", 1) || this.appendChild(this.createElement("title"))
		el.textContent = text
	},
	nodeType: 9,
	nodeName: "#document",
	contentType: "application/xml",
	createElement: own(HTMLElement),
	createElementNS: own(ElementNS),
	createTextNode: own(Text),
	createComment: own(Comment),
	createDocumentFragment: own(DocumentFragment),
	getElementById(id) {
		return selector.find(this, "#" + id, 1)
	},
	implementation: {
		createDocument,
		createHTMLDocument,
		createDocumentType: own(DocumentType)
	},
})

function createHTMLDocument(title) {
	var doc = new Document()
	, html = doc.appendChild(doc.createElement("html"))
	, head = html.appendChild(doc.createElement("head"))
	doc.contentType = "text/html"
	if (title != null) {
		head.appendChild(doc.createElement("title")).textContent = title
	}
	html.appendChild(doc.body = doc.createElement("body"))
	return doc
}
function createDocument(ns, qname, doctype) {
	var doc = new Document()
	if (doctype) doc.appendChild(doctype)
	if (qname) {
		qname = ns ? doc.createElementNS(ns, qname) : doc.createElement(qname)
		if (ns) qname.setAttribute("xmlns", ns)
		doc.appendChild(qname)
	}
	return doc
}
function DOMParser() {}
function XMLSerializer() {}

DOMParser.prototype.parseFromString = function(str, mime) {
	var doc = mime && /xml/.test(mime) ? createDocument(null, "", null) : createHTMLDocument("")
	doc.contentType = mime || "text/html"
	doc.innerHTML = str
	return doc
}
XMLSerializer.prototype.serializeToString = doc => stringify(doc)


function own(Class) {
	return function($1, $2) {
		var node = new Class($1, $2)
		node.ownerDocument = this
		return node
	}
}

function extendNode(obj, extras) {
	obj.prototype = Object.create(Node)
	for (var i = 1; (extras = arguments[i++]); ) {
		Object.defineProperties(obj.prototype, Object.getOwnPropertyDescriptors(extras))
	}
	obj.prototype.constructor = obj
}

function removeChilds(node) {
	for (var arr = node.childNodes, len = arr.length; len > 0; ) arr[--len].parentNode = null
	arr.length = 0
}

function getElement(childs, index, step) {
	if (childs && index > -1) for (; childs[index]; index += step) {
		if (childs[index].nodeType === 1) return childs[index]
	}
	return null
}

function getSibling(node, step, type) {
	var silbings = node.parentNode && node.parentNode.childNodes
	, index = silbings ? silbings.indexOf(node) : -1
	return type ? getElement(silbings, index + step, step) : silbings && silbings[index + step] || null
}

function mergeAttributes(source, target) {
	if (source && target && source.attributes) {
		for (var i = 0; i < source.attributes.length; i++) target.setAttribute(source.attributes[i].name, source.attributes[i].value)
	}
}

exports.createDocument = createDocument
exports.createHTMLDocument = createHTMLDocument
exports.document = createHTMLDocument("")
exports.entities = entities
exports.mergeAttributes = mergeAttributes
exports.selectorSplit = selector.selectorSplit
exports.CSS = CSS
exports.CSSStyleDeclaration = CSSStyleDeclaration
exports.CSSStyleSheet = CSSStyleSheet
exports.DOMParser = DOMParser
exports.Document = Document
exports.DocumentFragment = DocumentFragment
exports.Event = Event
exports.HTMLElement = HTMLElement
exports.Node = Node
exports.stringify = stringify
exports.XMLSerializer = XMLSerializer

