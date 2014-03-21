[1]: https://secure.travis-ci.org/litejs/dom-lite.png
[2]: https://travis-ci.org/litejs/dom-lite
[3]: https://coveralls.io/repos/litejs/dom-lite/badge.png
[4]: https://coveralls.io/r/litejs/dom-lite
[npm package]: https://npmjs.org/package/dom-lite
[GitHub repo]: https://github.com/litejs/dom-lite


    @version    0.0.1
    @date       2014-03-21
    @stability  2 - Unstable


DOM lite &ndash; [![Build][1]][2] [![Coverage][3]][4]
========

A minimal DOM implementation


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

el.toString();
// <h1 id="123" class="large">hello world</h1>
```



External links
--------------

-   [GitHub repo][]
-   [npm package][]



### Licence

Copyright (c) 2012 Lauri Rooden &lt;lauri@rooden.ee&gt;  
[The MIT License](http://lauri.rooden.ee/mit-license.txt)


