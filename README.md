
[1]: https://badgen.net/coveralls/c/github/litejs/dom
[2]: https://coveralls.io/r/litejs/dom
[3]: https://packagephobia.now.sh/badge?p=@litejs/dom
[4]: https://packagephobia.now.sh/result?p=@litejs/dom
[5]: https://badgen.net/badge/icon/Buy%20Me%20A%20Tea/orange?icon=kofi&label
[6]: https://www.buymeacoffee.com/lauriro


LiteJS DOM &ndash; [![Coverage][1]][2] [![Size][3]][4] [![Buy Me A Tea][5]][6]
==========

Dependency-free DOM library for handling HTML files on server-side.  
[DOM spec](https://dom.spec.whatwg.org/) |
[Selectors Level 3](http://www.w3.org/TR/selectors/)


Examples
--------

```javascript
const { document, DOMParser, XMLSerializer } = require("@litejs/dom");

// Build DOM manually
const el = document.createElement("h1");
el.id = 123;
el.className = "large";

const fragment = document.createDocumentFragment();
fragment.appendChild(document.createTextNode("hello"));
el.appendChild(fragment);

// Replace the DOM tree with parsed HTML
el.innerHTML = "<b>hello world</b>";
el.toString();
// <h1 id="123" class="large"><b>hello world</b></h1>

// minify output
el.toString(true);
// <h1 id=123 class=large><b>hello world</b></h1>

el.querySelectorAll("b");
// [ "<b>hello world</b>" ]

// Use XMLHttpRequest in server side
const { XMLHttpRequest } = require("@litejs/dom/net.js");
const xhr = new XMLHttpRequest();
xhr.open("GET", "https://litejs.com");
xhr.responseType = "document";
xhr.onload = function() {
	const document = xhr.responseXML;
	// Work with DOM in familiar way
	console.log(document.querySelector("title").textContent);
}
xhr.send();
```

## Contributing

Follow [Coding Style Guide](https://github.com/litejs/litejs/wiki/Style-Guide),
run tests `npm install; npm test`.


> Copyright (c) 2014-2024 Lauri Rooden &lt;lauri@rooden.ee&gt;  
[MIT License](https://litejs.com/MIT-LICENSE.txt) |
[GitHub repo](https://github.com/litejs/dom) |
[npm package](https://npmjs.org/package/@litejs/dom) |
[Buy Me A Tea][6]


