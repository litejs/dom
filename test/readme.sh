#!/bin/sh -e

npm link
npm link @litejs/dom
awk '/```/{flag=!flag; next} flag' README.md > test/readme.mjs
node test/readme.mjs > test/readme.out
diff -N test/readme.out test/readme.out.ok
rm test/readme.mjs test/readme.out

