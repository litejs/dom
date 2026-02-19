export type JSONNode = {
	nodeType: number
	nodeName: string
	tagName?: string
	attributes?: Record<string, string>
	data?: string
	childNodes?: JSONNode[]
	contentType?: string
}

export interface Attr {
	name: string
	value: string
	ownerElement: HTMLElement
}

export interface NamedNodeMap {
	readonly length: number
	readonly ownerElement: HTMLElement
	names(): string[]
	getNamedItem(name: string): Attr | null
	setNamedItem(attr: Attr): Attr | null
	removeNamedItem(name: string): Attr | null
	toString(minify?: boolean): string
}

export interface NodeConstants {
	readonly ELEMENT_NODE: 1
	readonly TEXT_NODE: 3
	readonly PROCESSING_INSTRUCTION_NODE: 7
	readonly COMMENT_NODE: 8
	readonly DOCUMENT_NODE: 9
	readonly DOCUMENT_TYPE_NODE: 10
	readonly DOCUMENT_FRAGMENT_NODE: 11
	readonly DOCUMENT_POSITION_DISCONNECTED: 1
	readonly DOCUMENT_POSITION_PRECEDING: 2
	readonly DOCUMENT_POSITION_FOLLOWING: 4
	readonly DOCUMENT_POSITION_CONTAINS: 8
	readonly DOCUMENT_POSITION_CONTAINED_BY: 16
	readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
}

export type MinifyOption = boolean | { css?: boolean }

export abstract class Node {
	static readonly ELEMENT_NODE: 1
	static readonly TEXT_NODE: 3
	static readonly PROCESSING_INSTRUCTION_NODE: 7
	static readonly COMMENT_NODE: 8
	static readonly DOCUMENT_NODE: 9
	static readonly DOCUMENT_TYPE_NODE: 10
	static readonly DOCUMENT_FRAGMENT_NODE: 11
	static readonly DOCUMENT_POSITION_DISCONNECTED: 1
	static readonly DOCUMENT_POSITION_PRECEDING: 2
	static readonly DOCUMENT_POSITION_FOLLOWING: 4
	static readonly DOCUMENT_POSITION_CONTAINS: 8
	static readonly DOCUMENT_POSITION_CONTAINED_BY: 16
	static readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32

	nodeType: number
	nodeName: string
	parentNode: Node | null
	ownerDocument: Document | null
	childNodes: Node[]
	nodeValue: string | null
	textContent: string
	firstChild: Node | null
	lastChild: Node | null
	nextSibling: Node | null
	previousSibling: Node | null
	appendChild(child: Node): Node
	insertBefore(child: Node, ref?: Node | null): Node
	removeChild(child: Node): Node
	replaceChild(child: Node, ref: Node): Node
	cloneNode(deep?: boolean): Node
	contains(node: Node | null): boolean
	compareDocumentPosition(other: Node): number
	getRootNode(): Node
	hasChildNodes(): boolean
	toString(minify?: MinifyOption): string
	toJSON(): JSONNode
}

export class DocumentFragment extends Node {
	constructor()
	override nodeType: 11
	override nodeName: "#document-fragment"
}

export class CSSStyleDeclaration {
	constructor(cssText?: string)
	cssText: string
	[key: string]: string
}

export interface StyleSheetInit {
	min?: boolean | { css?: boolean }
	href?: string
	ownerNode?: HTMLElement
}

export class CSSStyleSheet {
	constructor(init?: StyleSheetInit, cssText?: string)
	href?: string
	ownerNode?: HTMLElement
	replaceSync(cssText: string): void
	toString(minify?: boolean | { css?: boolean }): string
}

export class HTMLElement extends Node {
	attributes: NamedNodeMap
	localName: string
	tagName: string
	namespaceURI: string
	style: CSSStyleDeclaration
	outerHTML: string
	innerHTML: string
	firstElementChild: HTMLElement | null
	lastElementChild: HTMLElement | null
	nextElementSibling: HTMLElement | null
	previousElementSibling: HTMLElement | null
	readonly sheet?: CSSStyleSheet
	replaceChildren(...nodes: Node[]): void
	getAttribute(name: string): string | null
	setAttribute(name: string, value: unknown): void
	removeAttribute(name: string): void
	hasAttribute(name: string): boolean
	getAttributeNS(ns: string | null, name: string): string | null
	setAttributeNS(ns: string | null, name: string, value: unknown): void
	removeAttributeNS(ns: string | null, name: string): void
	hasAttributeNS(ns: string | null, name: string): boolean
	getElementsByTagName(tag: string): HTMLElement[]
	getElementsByClassName(sel: string): HTMLElement[]
	querySelector(sel: string): HTMLElement | null
	querySelectorAll(sel: string): HTMLElement[]
	matches(sel: string): boolean
	closest(sel: string): HTMLElement | null
	blur(): void
	focus(): void
}

export class ElementNS extends HTMLElement {
	constructor(namespace: string | null, tag: string)
}

export class Text extends Node {
	constructor(data: string | number | null | undefined)
	data: string
}

export class Comment extends Node {
	constructor(data: string | number | null | undefined)
	data: string
}

export class DocumentType extends Node {
	constructor(name: string)
	data: string
}

export class Document extends HTMLElement {
	constructor()
	override nodeType: 9
	override nodeName: "#document"
	body: HTMLElement
	documentElement: HTMLElement
	contentType: string
	styleSheets: CSSStyleSheet[]
	title: string
	createElement(tag: string): HTMLElement
	createElementNS(namespace: string | null, tag: string): ElementNS
	createTextNode(data: string | number | null | undefined): Text
	createComment(data: string | number | null | undefined): Comment
	createDocumentType(name: string): DocumentType
	createDocumentFragment(): DocumentFragment
	getElementById(id: string): HTMLElement | null
}

export class DOMParser {
	parseFromString(str: string, mime?: string): Document
}

export class XMLSerializer {
	serializeToString(doc: Document): string
}

export const document: Document
export const entities: Record<string, string>
export function mergeAttributes(source: HTMLElement | null, target: HTMLElement | null): void
export function selectorSplit(selector: string): string[]
export const CSS: {
	escape(selector: string | number): string
	minify(sheet: CSSStyleSheet, min?: { color?: boolean }): string
}
