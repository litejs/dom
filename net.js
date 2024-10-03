/* global unescape */

/*! litejs.com/MIT-LICENSE.txt */


var DOM = require(".")
, URL = require("url").URL
, parser = new DOM.DOMParser()
, dataUrlRe = /^([^;,]*?)(;[^,]+?|),(.*)$/
, setState = (xhr, state) => {
	if (xhr.readyState !== state) {
		xhr.readyState = state
		if (xhr.onreadystatechange) xhr.onreadystatechange()
		if (state === xhr.DONE && xhr.onload) xhr.onload()
	}
}

exports.XMLHttpRequest = XMLHttpRequest
exports.defaultHeaders = {
	accept: ["Accept", "*/*"]
}
exports.protocolHandler = {}

function XMLHttpRequest() {
	this._reqHeaders = Object.assign({}, exports.defaultHeaders)
}


XMLHttpRequest.prototype = {
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4,
	readyState: 0,
	status: 0,
	statusText: "",
	response: "",
	responseText: "",
	responseType: "",
	responseURL: "",
	get responseXML() {
		var xhr = this
		, mime = (xhr.getResponseHeader("Content-Type") || "").split(";")[0]
		return (
			xhr.readyState !== xhr.DONE ? null :
			// XMLHttpRequest spec originally supported only XML
			mime !== "application/xml" && xhr.responseType !== "document" ? null :
			parser.parseFromString(xhr.responseText, mime)
		)
	},
	getAllResponseHeaders() {
		var xhr = this
		return xhr.readyState >= xhr.HEADERS_RECEIVED && Object.keys(xhr._headers).map(
			name => name + ": " + xhr._headers[name] + "\r\n"
		).join("") || null
	},
	getResponseHeader(name) {
		var xhr = this
		return xhr.readyState >= xhr.HEADERS_RECEIVED && xhr._headers[name.toLowerCase()] || null
	},
	setRequestHeader(name, value) {
		this._reqHeaders[name.toLowerCase()] = [name, value]
	},
	abort() {
		throw Error("XMLHttpRequest abort/reuse not implemented")
	},
	open(method, url, isAsync) {
		var xhr = this
		xhr._sync = isAsync === false

		if (xhr.readyState > xhr.UNSENT) {
			xhr.abort()
		}

		xhr.method = method
		xhr.responseURL = url
		setState(xhr, xhr.OPENED)
	},
	send(data) {
		var xhr = this
		, url = new URL(xhr.responseURL, XMLHttpRequest.base)
		, proto = url.protocol.slice(0, -1)
		, head = (code, text, headers) => {
			xhr.status = code
			xhr.statusText = text
			xhr._headers = headers
			setState(xhr, xhr.HEADERS_RECEIVED)
		}
		, fillBody = chunk => {
			xhr.responseText += chunk.toString("utf8")
			setState(xhr, xhr.LOADING)
		}
		, done = err => {
			if (err) {
				if (xhr.onerror) xhr.onerror(err)
				else throw err
			}
			else if (xhr._sync) setState(xhr, xhr.DONE)
			else process.nextTick(setState, xhr, xhr.DONE)
		}

		if (proto === "http" || proto === "https") {
			if (xhr._sync) throw Error("XMLHttpRequest sync not implemented")
			url.method = xhr.method
			url.headers = Object.keys(xhr._reqHeaders).reduce((result, key) => {
				var entrie = xhr._reqHeaders[key]
				result[entrie[0]] = entrie[1]
				return result
			}, {})
			var req = require(proto).request(url, res => {
				head(res.statusCode, res.statusMessage, res.headers)
				res.on("data", fillBody)
				res.on("end", done)
			})
			req.on("error", done)
			req.end(data)
			return
		}
		if (proto === "data") {
			var match = dataUrlRe.exec(url.pathname)
			if (match) {
				head(200, "OK", { "content-type": match[1] || "text/plain" })
				fillBody(match[2] ? Buffer.from(match[3], "base64") : unescape(match[3]))
				done()
			} else done(Error("Invalid URL: " + url))
			return
		}

		if (proto === "file") {
			require("fs").readFile(url, (err, chunk) => {
				if (err) {
					head(404, "Not Found", {})
				} else {
					head(200, "OK", { "content-type": "text/plain" })
					fillBody(chunk)
				}
				done()
			})
			return
		}

		if (exports.protocolHandler[proto]) {
			exports.protocolHandler[proto](url, head, fillBody, done)
			return
		}

		throw Error("Unsuported protocol in: " + url)
	}
}


