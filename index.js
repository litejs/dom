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
    __fake:          true,
    textContent:     "",
    nodeName:        null,
    parentNode:      null,
    childNodes:      null,
    firstChild:      null,
    lastChild:       null,
    previousSibling: null,
    nextSibling:     null,
    get outerHTML() {
        return this.toString()
    },
    appendChild: function(el) {
        return this.insertBefore(el)
    },
    insertBefore: function(el, ref) {
        var t = this
        , childs = t.childNodes

        if (el.parentNode) el.parentNode.removeChild(el)
        el.parentNode = t

        // If ref is null, insert el at the end of the list of children.
        childs.splice(ref ? childs.indexOf(ref) : childs.length, 0, el)
        t._updateLinks(el, ref, ref && ref.previousSibling)
        return el
    },
    removeChild: function(el) {
        var t = this
        , index = t.childNodes.indexOf(el)
        if (index == -1) throw new Error("NOT_FOUND_ERR")

        t.childNodes.splice(index, 1)
        el.parentNode = null
        t._updateLinks(el.previousSibling, el.nextSibling, el)
        return el
    },
    replaceChild: function(el, ref) {
        this.insertBefore(el, ref)
        return this.removeChild(ref)
    },
    cloneNode: function(deep) {
        var key
        , t = this
        , node = new t.constructor(t.tagName || t.textContent)

        if (t.hasAttribute) {
            for (key in t) if (t.hasAttribute(key)) node[key] = t[key]
            for (key in t.style) node.style[key] = t.style[key]
        }

        if (deep && t.childNodes) {
            node.childNodes = t.childNodes.map(function(child){
                return child.cloneNode(deep)
            })
        }
        return node
    },
    hasChildNodes: function() {
        return this.childNodes && this.childNodes.length > 0
    },
    _updateLinks: function() {
        var el, index
        , t = this
        , childs = t.childNodes
        , len = arguments.length

        t.firstChild = childs[0] || null
        t.lastChild  = childs[ childs.length - 1 ] || null

        if (len) while (len--) {
            el = arguments[len]
            if (!el) continue
            childs = el.parentNode && el.parentNode.childNodes
            index = childs && childs.indexOf(el) || 0
            el.nextSibling = childs && childs[ index + 1 ] || null
            if (el.nextSibling) el.nextSibling.previousSibling = el
            el.previousSibling = index > 0 && childs[ index - 1 ] || null
            if (el.previousSibling) el.previousSibling.nextSibling = el
        }
    },
    toString: function() {
        var result = this.textContent || ""

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
    var t = this
    t.nodeName = t.tagName = tag.toLowerCase()
    t.childNodes = []
    t.style = {}
}

var el_re = /([.#:[])([-\w]+)(?:=([-\w]+)])?]?/g

extend(HTMLElement, Node, {
    nodeType: 1,
    tagName: null,
    style: null,
    className: "",
    /*
    * Void elements:
    * http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
    */
    _voidElements: { AREA:1, BASE:1, BR:1, COL:1, EMBED:1, HR:1, IMG:1, INPUT:1,
        KEYGEN:1, LINK:1, MENUITEM:1, META:1, PARAM:1, SOURCE:1, TRACK:1, WBR:1 },
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
        return this._find(sel, 1)
    },
    querySelectorAll: function(sel) {
        return this._find(sel)
    },
    _find: function(sel, first) {
        var el
        , i = 0
        , out = []
        , rules = ["_"]
        , tag = sel.replace(el_re, function(_, o, s, v) {
                rules.push(
                    o == "." ? "(' '+_.className+' ').indexOf(' "+s+" ')>-1" :
                    o == "#" ? "_.id=='"+s+"'" :
                    "_.getAttribute('"+s+"')"+(v?"=='"+v+"'":"")
                )
                return ""
            }) || "*"
        , els = this.getElementsByTagName(tag)
        , fn = Function("_", "return " + rules.join("&&"))

        for (; el = els[i++]; ) if (fn(el)) {
            if (first) return el
            out.push(el)
        }
        return first ? null : out
    },
    _getAttributesString: function() {
        var key
        , t = this
        , attrs = []

        for (key in t) if (t.hasAttribute(key)) {
            attrs.push(key + '="' + t[key] + '"')
        }

        if (t.className) {
            attrs.push('class="' + t.className + '"')
        }

        var style = Object.keys(t.style).reduce(function (str, key) {
            return str + key + ":" + t.style[key] + ";"
        }, "")
        if (style) attrs.push('style="' + style + '"')

        return attrs.length ? " " + attrs.join(" ") : ""
    },
    toString: function() {
        var t = this, result = "<" + t.tagName + t._getAttributesString()

        if (t._voidElements[t.tagName]) {
            return result + "/>"
        }

        return result + ">" +
            Node.prototype.toString.call(t) +
            "</" + t.tagName + ">"
    }
})


function Text(value) {
    this.textContent = value
}

extend(Text, Node, {
    nodeType: 3,
    nodeName: "#text"
})

function Comment(value) {
    this.textContent = value
}

extend(Comment, Node, {
    nodeType: 8,
    nodeName: "#comment",
    toString: function() {
        return "<!--" + this.textContent + "-->"
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
    createElementNS: function(ns, tag) {
        return this.createElement(tag)
    },
    createTextNode: function(value) {
        return new Text(value)
    },
    createCommentNode: function(value) {
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
