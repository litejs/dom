[1]: https://badgen.net/travis/litejs/dom-lite
[2]: https://travis-ci.org/litejs/dom-lite
[3]: https://badgen.net/coveralls/c/github/litejs/dom-lite
[4]: https://coveralls.io/r/litejs/dom-lite
[5]: https://badgen.net/packagephobia/install/dom-lite@19.11.0
[6]: https://packagephobia.now.sh/result?p=dom-lite
[7]: https://badgen.net/badge/icon/Buy%20Me%20A%20Tea/orange?icon=kofi&label
[8]: https://www.buymeacoffee.com/lauriro


DOM lite &ndash; [![Build][1]][2] [![Coverage][3]][4] [![Size][5]][6] [![Buy Me A Tea][7]][8]
========

A small DOM implementation
where most of DOM attributes and methods from document are implemented.


Examples
--------

```javascript
var document = require("dom-lite").document;

var el = document.createElement("h1");
el.id = 123;
el.className = "large";

var fragment = document.createDocumentFragment();
var text1 = document.createTextNode("hello");
var text2 = document.createTextNode(" world");

fragment.appendChild(text1);
fragment.appendChild(text2);
el.appendChild(fragment);

el.innerHTML;
// hello world
el.innerHTML = "<b>hello world</b>"
el.outerHTML;
// <h1 id="123" class="large"><b>hello world</b></h1>
el.querySelectorAll("b");
// [ "<b>hello world</b>" ]
```


## External links

[GitHub repo](https://github.com/litejs/dom-lite) |
[npm package](https://npmjs.org/package/dom-lite) |
[DOM spec](https://dom.spec.whatwg.org/) |
[Selectors Level 3](http://www.w3.org/TR/selectors/) |
[Travis CI](https://travis-ci.org/litejs/dom-lite) |
[Coveralls coverage](https://coveralls.io/github/litejs/dom-lite)  
[Coding Style Guidelines](https://github.com/litejs/litejs/wiki/Style-Guidelines) |
[Buy Me A Tea][8]


## Licence

Copyright (c) 2014-2020 Lauri Rooden &lt;lauri@rooden.ee&gt;  
[The MIT License](http://lauri.rooden.ee/mit-license.txt)


