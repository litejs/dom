
[1]: https://badgen.net/coveralls/c/github/litejs/dom
[2]: https://coveralls.io/r/litejs/dom
[3]: https://badgen.net/packagephobia/install/@litejs/dom
[4]: https://packagephobia.now.sh/result?p=@litejs/dom
[5]: https://badgen.net/badge/icon/Buy%20Me%20A%20Tea/orange?icon=kofi&label
[6]: https://www.buymeacoffee.com/lauriro


LiteJS DOM &ndash; [![Coverage][1]][2] [![Size][3]][4] [![Buy Me A Tea][5]][6]
==========

A small DOM library for server-side testing, rendering, and handling of HTML files.

[DOM spec](https://dom.spec.whatwg.org/) |
[Selectors Level 3](http://www.w3.org/TR/selectors/)


Examples
--------

```javascript
const { document, DOMParser, XMLSerializer } = require("@litejs/dom");
const { XMLHttpRequest } = require("@litejs/dom/net");

// Use XMLHttpRequest in server side
var xhr = new XMLHttpRequest()
xhr.open("GET", "https://litejs.com")
xhr.responseType = "document"
xhr.onload = function() {
	var doc = xhr.responseXML
	// Work with DOM in familiar way
	console.log(doc.querySelector("title").textContent)
}
xhr.send()

// Build DOM manually
const el = document.createElement("h1");
el.id = 123;
el.className = "large";

const fragment = document.createDocumentFragment();
const text1 = document.createTextNode("hello");
const text2 = document.createTextNode(" world");

fragment.appendChild(text1);
fragment.appendChild(text2);
el.appendChild(fragment);

el.innerHTML;
// hello world
el.innerHTML = "<b>hello world</b>";
el.toString();
// <h1 id="123" class="large"><b>hello world</b></h1>

// minify output
el.toString(true);
// <h1 id=123 class=large><b>hello world</b></h1>

el.querySelectorAll("b");
// [ "<b>hello world</b>" ]
```

## Contributing

Follow [Coding Style Guide](https://github.com/litejs/litejs/wiki/Style-Guide)
and run tests.

```
npm install
npm test
```

## Licence

Copyright (c) 2014-2023 Lauri Rooden &lt;lauri@rooden.ee&gt;  
[MIT License](https://litejs.com/MIT-LICENSE.txt) |
[GitHub repo](https://github.com/litejs/dom) |
[npm package](https://npmjs.org/package/@litejs/dom) |
[coverage][2] |
[Buy Me A Tea][6]


