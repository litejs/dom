
[1]: https://badgen.net/coveralls/c/github/litejs/dom-lite
[2]: https://coveralls.io/r/litejs/dom-lite
[3]: https://badgen.net/packagephobia/install/dom-lite
[4]: https://packagephobia.now.sh/result?p=dom-lite
[5]: https://badgen.net/badge/icon/Buy%20Me%20A%20Tea/orange?icon=kofi&label
[6]: https://www.buymeacoffee.com/lauriro


DOM lite &ndash; [![Coverage][1]][2] [![Size][3]][4] [![Buy Me A Tea][5]][6]
========

A small DOM implementation
where most of DOM attributes and methods from document are implemented.


Examples
--------

```javascript
const { document, DOMParser, XMLSerializer } = require("dom-lite");

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

Run tests

```
npm install -g jshint c8
npm install
npm test
jshint *.js
```


## External links

[GitHub repo](https://github.com/litejs/dom-lite) |
[npm package](https://npmjs.org/package/dom-lite) |
[DOM spec](https://dom.spec.whatwg.org/) |
[Selectors Level 3](http://www.w3.org/TR/selectors/) |
[Coveralls coverage][2]  
[Buy Me A Tea][6]


## Licence

Copyright (c) 2014-2022 Lauri Rooden &lt;lauri@rooden.ee&gt;  
[The MIT License](http://lauri.rooden.ee/mit-license.txt)


