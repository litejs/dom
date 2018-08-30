[1]: https://secure.travis-ci.org/litejs/dom-lite.png
[2]: https://travis-ci.org/litejs/dom-lite
[3]: https://coveralls.io/repos/litejs/dom-lite/badge.png
[4]: https://coveralls.io/r/litejs/dom-lite
[npm package]: https://npmjs.org/package/dom-lite
[GitHub repo]: https://github.com/litejs/dom-lite


DOM lite &ndash; [![Build][1]][2] [![Coverage][3]][4]
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


External links
--------------

 - [GitHub repo][]
 - [npm package][]
 - [DOM spec](https://dom.spec.whatwg.org/)
 - [Selectors Level 3](http://www.w3.org/TR/selectors/)
 - [Coding Style Guidelines](https://github.com/litejs/litejs/wiki/Style-Guidelines)



### Licence

Copyright (c) 2014-2018 Lauri Rooden &lt;lauri@rooden.ee&gt;  
[The MIT License](http://lauri.rooden.ee/mit-license.txt)


