
/*! litejs.com/MIT-LICENSE.txt */

var boolAttrs = {
	async:1, autoplay:1, loop:1, checked:1, defer:1, disabled:1, muted:1, multiple:1, nomodule:1, playsinline:1, readonly:1, required:1, selected:1
}
, numAttrs = "height maxLength minLength size tabIndex width"
, strAttrs = "accept accesskey autocapitalize autofocus capture class contenteditable crossorigin dir for hidden href id integrity lang name nonce rel slot spellcheck src title type translate"
, defaultAttrs = {
	"form method get":1, "input type text":1,
	"script type text/javascript":1, "style type text/css":1
}
, voidElements = {
	AREA:1, BASE:1, BR:1, COL:1, EMBED:1, HR:1, IMG:1, INPUT:1, KEYGEN:1, LINK:1, MENUITEM:1, META:1, PARAM:1, SOURCE:1, TRACK:1, WBR:1
}
, svgVoidElements = {
	circle:1, ellipse:1, image:1, line:1, path:1, polygon:1, polyline:1, rect:1, stop:1, use:1,
}
, rawTextElements = { SCRIPT: /<(?=\/script)/i, STYLE: /<(?=\/style)/i }
, rawTextEscape = { SCRIPT: /<(?=\/script|!--)/ig, STYLE: /<(?=\/style|!--)/ig }
, hasOwn = voidElements.hasOwnProperty
, { selectorSplit, CSSStyleDeclaration, CSSStyleSheet } = require("./css.js")
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
		if (this.nodeType === 3 || this.nodeType === 8) this.data = text
	},
	get textContent() {
		return this.nodeType === 3 || this.nodeType === 8 ? this.data : this.childNodes.map(node => node.textContent).join("")
	},
	set textContent(text) {
		if (this.nodeType === 3 || this.nodeType === 8) this.data = text
		else replaceChildren.call(this, this.ownerDocument.createTextNode(
			rawTextEscape[this.tagName] ? text.replace(rawTextEscape[this.tagName], "<\\") : text
		))
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
		var child, m, re, text
		, node = this
		, doc = node.ownerDocument || node
		, tagRe = /<(!--([\s\S]*?)--!?|!\[CDATA\[([\s\S]*?)\]\]|[?!][\s\S]*?)>|<(\/?)([^ \/>]+)((?:("|')(?:\\\7|[\s\S])*?\7|[^>])*?)(\/?)>|[^<]+|</g
		, attrRe = /([^=\s]+)(?:\s*=\s*(("|')((?:\\\3|[\s\S])*?)\3|[^\s"'`=<>]+)|)/g
		, frag = doc.createDocumentFragment()
		, tree = frag
		, voidEl = doc.documentElement.tagName === "svg" ? svgVoidElements : voidElements

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
					m[1] ? doc.createDocumentType(m[1]) :
					doc.createTextNode(m[0].replace(unescRe, unescFn))
				)
			}
		}
		replaceChildren.call(node, frag)

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
	},
	get sheet() {
		return makeSheet(this)
	},
	get style() {
		return this._style || (this._style = CSSStyleDeclaration(this.getAttribute("style") || ""))
	},
	set style(value) {
		this.style.cssText = value
	},
	contains(el) {
		for (; el; el = el.parentNode) if (el === this) return true
		return false
	},
	hasChildNodes() {
		return !!this.firstChild
	},
	getElementById(id) {
		return selector.find(this, "#" + id, 1)
	},
	appendChild(el) {
		return this.insertBefore(el)
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
	querySelector(sel) {
		return selector.find(this, sel, 1)
	},
	querySelectorAll(sel) {
		return selector.find(this, sel)
	},
	toString(min) {
		return rawTextElements[this.tagName] ? (
			this.tagName === "STYLE" && (min === true || min && min.css) ? "\n" + makeSheet(this, min.css || true) + "\n" :
			this.textContent
		) : this.childNodes.map(node => node.toString(min)).join("")
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
	replaceChildren: replaceChildren,
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
, quotedAttrRe = /[\s"'`=<>]/
, escRe = /<|&(?=[a-z#])/gi
, escFn = chr => chr === "<" ? "&lt;" : "&amp;"
, unescRe = /&[a-z]{1,31};?|&#(x|)([\da-f]+);/ig
, unescFn = (ent, hex, num) => num ? String.fromCharCode(parseInt(num, hex === "" ? 10 : 16)) : entities[ent] || ent
, entities = {
	"&amp;": "&", "&apos;": "'", "&cent;": "¢", "&copy;": "©", "&curren;": "¤",
	"&deg;": "°", "&euro;": "€", "&gt;": ">", "&lt;": "<", "&nbsp;": " ",
	"&plusmn;": "±", "&pound;": "£", "&quot;": "\"", "&reg;": "®",
	"&sect;": "§", "&sup2;": "²", "&sup3;": "³", "&yen;": "¥"
}

Object.keys(boolAttrs).forEach(addGetter, { isBool: true, readonly: "readOnly" })
numAttrs.split(" ").forEach(addGetter, { isNum: true })
strAttrs.split(" ").forEach(addGetter, { "for": "htmlFor", "class": "className" })

function addGetter(key) {
	var attr = key.toLowerCase()
	Object.defineProperty(Element, this[key] || key, {
		configurable: true,
		enumerable: true,
		get: (
			this.isBool ? function() { return this.hasAttribute(attr) } :
			this.isNum ? function() { return +this.getAttribute(attr) || 0 } :
			function() { return this.getAttribute(attr) || "" }
		),
		set(value) {
			this.setAttribute(attr, value)
		}
	})
}

;["hasAttribute", "getAttribute", "setAttribute", "removeAttribute"].forEach(function(name) {
	Element[name + "NS"] = function(ns, a, b) {
		return this[name].call(this, a, b)
	}
})

function Attr(node, name, value) {
	this.ownerElement = node
	this.name = name
	this.value = "" + value
}

function NamedNodeMap(node) {
	Object.defineProperty(this, "length", { get() { return this.names().length } })
	Object.defineProperty(this, "ownerElement", { value: node })
}

NamedNodeMap.prototype = {
	names() {
		this.getNamedItem("style")
		return Object.keys(this)
	},
	getNamedItem(name) {
		var loName = name.toLowerCase()
		, attr = this[loName] || null
		if (loName === "style" && this.ownerElement._style) {
			if (attr === null) attr = this[loName] = new Attr(this.ownerElement, name, "")
			attr.value = this.ownerElement._style.cssText
		}
		return attr
	},
	removeNamedItem(name) {
		var loName = name.toLowerCase()
		, attr = this[loName] || null
		if (loName === "style") delete this.ownerElement._style
		if (attr !== null) delete this[loName]
		return attr
	},
	setNamedItem(attr) {
		var oldAttr = this.getNamedItem(attr.name)
		this[attr.name.toLowerCase()] = attr
		return oldAttr
	},
	toString(minify) {
		var map = this
		, tagName = map.ownerElement.tagName
		, isXml = map.ownerElement.ownerDocument.contentType === "application/xml"
		return map.names().map(loName => {
			if (loName === "style" && minify && map.ownerElement.style) { /* Access to style makes _style */ }
			var attr = map.getNamedItem(loName)
			, name = attr.name
			, value = attr.value.replace(escRe, escFn)
			if (!isXml) {
				if (hasOwn.call(boolAttrs, loName)) return name
				if (minify) {
					value = loName.slice(0, 2) === "on" ? value.replace(/^[\s\uFEFF\xA0;]+|[\s\uFEFF\xA0;]+$/g, "") : value.replace(/\s+/g, " ").trim()
					if (hasOwn.call(defaultAttrs, (tagName + " " + name + " " + value).toLowerCase())) return
					if (!quotedAttrRe.test(value)) return name + "=" + value
					if (value.split("\"").length > value.split("'").length) return name + "='" + value.replace(/'/g, "&#39;") + "'"
				}
				name = loName
			}
			return name + "=\"" + value.replace(/"/g, "&quot;") + "\""
		}).filter(Boolean).join(" ")
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
	blur() {
		this.ownerDocument.activeElement = null
	},
	closest(sel) {
		return selector.closest(this, sel)
	},
	focus() {
		this.ownerDocument.activeElement = this
	},
	matches(sel) {
		return selector.matches(this, sel)
	},
	toString(minify) {
		var attrs = this.attributes.toString(minify)
		, isXml = this.ownerDocument.contentType === "application/xml"
		, voidEl = this.ownerDocument.documentElement.tagName === "svg" ? svgVoidElements : voidElements
		return "<" + this.localName +
			(attrs ? " " + (attrs.slice(-1) === "/" ? attrs + " " : attrs) : "") +
			(voidEl[this.tagName] ? (isXml ? "/>" : ">") : ">" + Node.toString.call(this, minify) + "</" + this.localName + ">")
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
	this.data = data
}

extendNode(Text, {
	nodeType: 3,
	nodeName: "#text",
	toString(minify) {
		return (minify ? ("" + this.data).trim() : "" + this.data).replace(escRe, escFn)
	}
})

function Comment(data) {
	this.data = data
}

extendNode(Comment, {
	nodeType: 8,
	nodeName: "#comment",
	toString(minify) {
		return minify ? "" : "<!--" + this.data + "-->"
	}
})

function DocumentType(data) {
	this.data = data
}

extendNode(DocumentType, {
	nodeType: 10,
	toString() {
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

DOMParser.prototype.parseFromString = (str, mime) => {
	var doc = new Document()
	doc.contentType = mime || "text/html"
	doc.documentElement.outerHTML = str
	return doc
}
XMLSerializer.prototype.serializeToString = doc => doc.toString()


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

function replaceChildren() {
	for (var arr = this.childNodes, i = 0, l = arr.length; i < l; ) arr[i++].parentNode = null
	for (i = arr.length = 0, l = arguments.length; i < l; ) this.insertBefore(arguments[i++])
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
	return type > 0 ? getElement(silbings, index + step, step, type) : silbings && silbings[index + step] || null
}

function makeSheet(el, min) {
	if (el.tagName === "STYLE" || el.tagName === "LINK" && el.rel === "stylesheet" && el.href) return new CSSStyleSheet({
		href: el.href,
		ownerNode: el,
		min
	}, el.tagName === "STYLE" && el.textContent)
}

function mergeAttributes(source, target) {
	if (source && target && source.attributes) {
		source.attributes.names().forEach(attr => target.setAttribute(attr, source.getAttribute(attr)))
	}
}

exports.document = new Document()
exports.entities = entities
exports.mergeAttributes = mergeAttributes
exports.selectorSplit = selectorSplit
exports.CSSStyleDeclaration = CSSStyleDeclaration
exports.CSSStyleSheet = CSSStyleSheet
exports.DOMParser = DOMParser
exports.Document = Document
exports.DocumentFragment = DocumentFragment
exports.HTMLElement = HTMLElement
exports.Node = Node
exports.XMLSerializer = XMLSerializer

