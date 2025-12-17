import {
	document,
	DOMParser,
	XMLSerializer,
	HTMLElement,
	CSSStyleSheet,
	cssEscape,
	selectorSplit,
	mergeAttributes,
	JSONNode
} from "@litejs/dom"

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends
	(<T>() => T extends B ? 1 : 2) ? true : false
type Expect<T extends true> = T

const parsed = new DOMParser().parseFromString("<root><child/></root>")
const el = parsed.createElement("div")
el.setAttribute("data-id", "1")
mergeAttributes(el, parsed.body)
parsed.body.appendChild(el)

const docJson: JSONNode = parsed.toJSON()
const elJson: JSONNode = el.toJSON()

const sheet = new CSSStyleSheet({ min: true }, ".a{color:red}")
sheet.replaceSync(".a { color: red }")

const serialized: string = new XMLSerializer().serializeToString(parsed)
const escaped: string = cssEscape(".a b")
const parts: string[] = selectorSplit(".a .b")

type ExpectDocJson = Expect<Equal<typeof docJson, JSONNode>>
type ExpectElJson = Expect<Equal<ReturnType<HTMLElement["toJSON"]>, JSONNode>>
type ExpectSheets = Expect<Equal<typeof parsed.styleSheets, CSSStyleSheet[]>>

// runtime references to ensure values exist
const docJsonString = JSON.stringify(docJson)
const elJsonString = JSON.stringify(elJson)
document.appendChild(parsed.documentElement)
void docJsonString
void elJsonString
void serialized
void escaped
void parts
