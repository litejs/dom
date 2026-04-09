
[1]: https://badgen.net/coveralls/c/github/litejs/dom
[2]: https://coveralls.io/r/litejs/dom
[3]: https://packagephobia.now.sh/badge?p=@litejs/dom
[4]: https://packagephobia.now.sh/result?p=@litejs/dom
[5]: https://badgen.net/badge/icon/Buy%20Me%20A%20Tea/orange?icon=kofi&label
[6]: https://www.buymeacoffee.com/lauriro


LiteJS DOM &ndash; [![Coverage][1]][2] [![Size][3]][4] [![Buy Me A Tea][5]][6]
==========

Dependency-free DOM library for handling HTML, XML and CSS files on server-side.


```javascript
// const { document } = require("@litejs/dom");
import { document, CSSStyleSheet, DOMParser, XMLSerializer } from "@litejs/dom";
import { XMLHttpRequest } from "@litejs/dom/net.js";

// Build DOM manually
const el = document.createElement("h1");
el.id = 123;
el.className = "large";

const fragment = document.createDocumentFragment();
fragment.appendChild(document.createTextNode("hello"));
el.appendChild(fragment);

// Replace the DOM tree with HTML
el.innerHTML = "<b>hello world</b>";
console.log(el.toString());
// <h1 id="123" class="large"><b>hello world</b></h1>

// Minify HTML
console.log(el.toString(true));
// <h1 id=123 class=large><b>hello world</b></h1>

el.querySelectorAll("b");
// [ "<b>hello world</b>" ]

// Use XMLHttpRequest in server side
const xhr = new XMLHttpRequest();
xhr.open("GET", "https://litejs.com");
xhr.responseType = "document";
xhr.onload = function() {
	const doc = xhr.responseXML;
	// Work with DOM in familiar way
	console.log(doc.querySelector("title").textContent);
}
xhr.send();

// Minify CSS
import { CSS } from "@litejs/dom/css.js";
const sheet = new CSSStyleSheet()
sheet.replaceSync(":root{--gap:10px} .a { color: hsl(0 0% 100%); top: calc(var(--gap) + 5px) }")
console.log(CSS.minify(sheet, { var: true, calc: true, color: true }))
// .a{color:#fff;top:15px}
```

### CSS.minify options

- **calc** &ndash; resolve static `calc()` expressions, e.g. `calc(10px + 5px)` &rarr; `15px`
- **color** &ndash; shorten `rgb()`/`hsl()` to hex, e.g. `rgb(255,0,0)` &rarr; `#f00`
- **import** &ndash; inline `@import` rules, rewriting relative URLs
- **prefix** &ndash; add vendor prefixes, e.g. `{ "mask-image": ["-webkit-"] }`
- **prune** &ndash; remove unused selectors `{ keep: Set, keepRe: RegExp }`
- **root** &ndash; base directory for resolving `@import` paths
- **url** &ndash; URL rewrite callback `(path) => newPath`
- **var** &ndash; inline CSS custom properties from `:root`

## Contributing

Follow [Coding Style Guide](https://github.com/litejs/litejs/wiki/Style-Guide),
run tests `npm install; npm test`.


> Copyright (c) 2014-2026 Lauri Rooden &lt;lauri@rooden.ee&gt;  
[MIT License](https://litejs.com/MIT-LICENSE.txt) |
[GitHub repo](https://github.com/litejs/dom) |
[npm package](https://npmjs.org/package/@litejs/dom) |
[Buy Me A Tea][6]


