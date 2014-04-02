


/*
* @version    0.0.9
* @date       2014-04-02
* @stability  2 - Unstable
* @author     Lauri Rooden <lauri@rooden.ee>
* @license    MIT License
*/



function extend(obj, _super, extras) {
	obj.prototype = Object.create(_super.prototype)
	for (var key in extras) {
		obj.prototype[key] = extras[key]
	}
	obj.prototype.constructor = obj
}


function Node(){}

Node.prototype = {
	nodeName:        null,
	parentNode:      null,
	ownerDocument:   null,
	childNodes:      null,
	get textContent() {
		return this.hasChildNodes() ? this.childNodes.map(function(child){
			return child[ child.nodeType == 3 ? "data" : "textContent" ]
		}).join("") : ""
	},
	set textContent(text) {
		for (var self = this; self.firstChild;) self.removeChild(self.firstChild)
		self.appendChild(self.ownerDocument.createTextNode(text))
	},
	get firstChild() {
		return this.childNodes && this.childNodes[0] || null
	},
	get lastChild() {
		return this.childNodes[ this.childNodes.length - 1 ] || null
	},
	get previousSibling() {
		var self = this
		, childs = self.parentNode && self.parentNode.childNodes
		, index = childs && childs.indexOf(self) || 0

		return index > 0 && childs[ index - 1 ] || null
	},
	get nextSibling() {
		var self = this
		, childs = self.parentNode && self.parentNode.childNodes
		, index = childs && childs.indexOf(self) || 0

		return childs && childs[ index + 1 ] || null
	},
	get innerHTML() {
		return Node.prototype.toString.call(this)
	},
	get outerHTML() {
		return this.toString()
	},
	hasChildNodes: function() {
		return this.childNodes && this.childNodes.length > 0
	},
	appendChild: function(el) {
		return this.insertBefore(el)
	},
	insertBefore: function(el, ref) {
		var self = this
		, childs = self.childNodes

		if (el.nodeType == 11) {
			while (el.firstChild) self.insertBefore(el.firstChild, ref)
		} else {
			if (el.parentNode) el.parentNode.removeChild(el)
			el.parentNode = self

			// If ref is null, insert el at the end of the list of children.
			childs.splice(ref ? childs.indexOf(ref) : childs.length, 0, el)
		}
		return el
	},
	removeChild: function(el) {
		var self = this
		, index = self.childNodes.indexOf(el)
		if (index == -1) throw new Error("NOT_FOUND_ERR")

		self.childNodes.splice(index, 1)
		el.parentNode = null
		return el
	},
	replaceChild: function(el, ref) {
		this.insertBefore(el, ref)
		return this.removeChild(ref)
	},
	cloneNode: function(deep) {
		var key
		, self = this
		, node = own(self.ownerDocument, new self.constructor(self.tagName || self.data))

		if (self.hasAttribute) {
			for (key in self) if (self.hasAttribute(key)) node[key] = self[key]
			for (key in self.style) node.style[key] = self.style[key]
		}

		if (deep && self.hasChildNodes()) {
			node.childNodes = self.childNodes.map(function(child){
				return child.cloneNode(deep)
			})
		}
		return node
	},
	toString: function() {
		return this.hasChildNodes() ? this.childNodes.reduce(function (memo, node) {
			return memo + node
		}, "") : this.data || ""
	}
}


function DocumentFragment() {
	this.childNodes = []
}

extend(DocumentFragment, Node, {
	nodeType: 11,
	nodeName: "#document-fragment"
})


function HTMLElement(tag) {
	var self = this
	self.nodeName = self.tagName = tag.toUpperCase()
	self.childNodes = []
	self.style = {}
}

var elRe = /([.#:[])([-\w]+)(?:=([-\w]+)])?]?/g

function findEl(node, sel, first) {
	var el
	, i = 0
	, out = []
	, rules = ["_"]
	, tag = sel.replace(elRe, function(_, o, s, v) {
		rules.push(
			o == "." ? "(' '+_.className+' ').indexOf(' "+s+" ')>-1" :
			o == "#" ? "_.id=='"+s+"'" :
			"_.getAttribute('"+s+"')"+(v?"=='"+v+"'":"")
		)
		return ""
	}) || "*"
	, els = node.getElementsByTagName(tag)
	, fn = Function("_", "return " + rules.join("&&"))

	for (; el = els[i++]; ) if (fn(el)) {
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

function attributesToString(node) {
	var key
	, attrs = []

	for (key in node) if (node.hasAttribute(key)) {
		attrs.push(key + '="' + node[key] + '"')
	}

	if (node.className) {
		attrs.push('class="' + node.className + '"')
	}

	var style = Object.keys(node.style).reduce(function (str, key) {
		return str + key + ":" + node.style[key] + ";"
	}, "")
	if (style) attrs.push('style="' + style + '"')

	return attrs.length ? " " + attrs.join(" ") : ""
}

extend(HTMLElement, Node, {
	nodeType: 1,
	tagName: null,
	style: null,
	className: "",
	hasAttribute: function(name) {
		return this.hasOwnProperty(name) && !(name in HTMLElement.prototype)
	},
	getAttribute: function(name) {
		return this.hasAttribute(name) ? this[name] : null
	},
	setAttribute: function(name, value) {
		this[name] = value
	},
	removeAttribute: function(name) {
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
			while (!next && (el = el.parentNode)) next = el.nextSibling
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
		return "<" + this.tagName + attributesToString(this) + ">"
			+ (voidElements[this.tagName] ? "" : this.innerHTML + "</" + this.tagName + ">" )
	}
})


function Text(data) {
	this.data = data
}

extend(Text, Node, {
	nodeType: 3,
	nodeName: "#text"
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

function Document(){
	this.body = this.createElement("body")
}

function own(self, node) {
	node.ownerDocument = self
	return node
}

extend(Document, Node, {
	nodeType: 9,
	nodeName: "#document",
	createElement: function(tag) {
		return own(this, new HTMLElement(tag))
	},
	createTextNode: function(value) {
		return own(this, new Text(value))
	},
	createComment: function(value) {
		return own(this, new Comment(value))
	},
	createDocumentFragment: function() {
		return own(this, new DocumentFragment())
	},
	getElementById: function(id) {
		return this.body.getElementById(id)
	},
	getElementsByTagName: function(tag) {
		return this.body.getElementsByTagName(tag)
	},
	querySelector: function(sel) {
		return this.body.querySelector(sel)
	},
	querySelectorAll: function(sel) {
		return this.body.querySelectorAll(sel)
	}
})

module.exports = {
	document: new Document,
	Document: Document,
	HTMLElement: HTMLElement
}

