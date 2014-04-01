/*
* Object
* |- Node
*    |- DocumentFragment
*    |- Element             // skip
*    |  |- HTMLElement
*    |     |- HTML*Element  // skip
*    |- CharacterData       // skip
*    |  |- Text
*/



function extend(obj, _super, extras) {
	obj.prototype = Object.create(_super.prototype)
	for (var key in extras) {
		obj.prototype[key] = extras[key]
	}
	obj.prototype.constructor = obj
}



/*
* http://dom.spec.whatwg.org/#node
*/
function Node(){}

Node.prototype = {
	nodeName:        null,
	parentNode:      null,
	childNodes:      null,
	get textContent() {
		return this.hasChildNodes() ? this.childNodes.map(function(child){
			return child[ child.nodeType == 3 ? "data" : "textContent" ]
		}).join("") : ""
	},
	set textContent(text) {
		for (var self = this; self.firstChild;) self.removeChild(self.firstChild)
		self.appendChild(new Text(text))
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
		, node = new self.constructor(self.tagName || self.data)

		if (self.hasAttribute) {
			for (key in self) if (self.hasAttribute(key)) node[key] = self[key]
			for (key in self.style) node.style[key] = self.style[key]
		}

		if (deep && self.childNodes) {
			node.childNodes = self.childNodes.map(function(child){
				return child.cloneNode(deep)
			})
		}
		return node
	},
	hasChildNodes: function() {
		return this.childNodes && this.childNodes.length > 0
	},
	toString: function() {
		var result = this.data || ""

		if (this.childNodes) return this.childNodes.reduce(function (memo, node) {
			return memo + node
		}, result)

		return result
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
	self.nodeName = self.tagName = tag.toLowerCase()
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
	area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1,
	keygen:1, link:1, menuitem:1, meta:1, param:1, source:1, track:1, wbr:1
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
		delete this.name
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
		tag = tag === "*" ? 1 : tag.toLowerCase()
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
		var self = this
		, result = "<" + self.tagName + attributesToString(self)

		if (voidElements[self.tagName]) {
			return result + ">"
		}

		return result + ">" + self.innerHTML + "</" + self.tagName + ">"
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

extend(Document, Node, {
	nodeType: 9,
	nodeName: "#document",
	createElement: function(tag) {
		return new HTMLElement(tag)
	},
	createTextNode: function(value) {
		return new Text(value)
	},
	createComment: function(value) {
		return new Comment(value)
	},
	createDocumentFragment: function() {
		return new DocumentFragment()
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

