/* global unescape */

var DOM = require(".")
, parser = new DOM.DOMParser()
, dataUrlRe = /^data:([^;,]*?)(;[^,]+?|),(.*)$/

function XMLHttpRequest() {}

function setState(xhr, state) {
	if (xhr.readyState !== state) {
		xhr.readyState = state
		if (xhr.onreadystatechange) xhr.onreadystatechange()
		if (state === xhr.DONE && xhr.onload) xhr.onload()
	}
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
	getAllResponseHeaders: function () {
		var xhr = this
		return xhr.readyState >= xhr.HEADERS_RECEIVED && Object.keys(xhr._headers).map(function(name) {
			return name + ": " + xhr._headers[name] + "\r\n"
		}).join("") || null
	},
	getResponseHeader: function (name) {
		var xhr = this
		return xhr.readyState >= xhr.HEADERS_RECEIVED && xhr._headers[name.toLowerCase()] || null
	},
	abort: function() {
		throw Error("XMLHttpRequest abort/reuse not implemented")
	},
	open: function (method, url, async) {
		var xhr = this
		if (async === false) throw Error("XMLHttpRequest sync not implemented")

		if (xhr.readyState > xhr.UNSENT) {
			xhr.abort()
		}

		xhr.method = method
		xhr.responseURL = url
		setState(xhr, xhr.OPENED)
	},
	send: function (data) {
		var xhr = this
		, url = xhr.responseURL
		, proto = url.split(":", 1)[0]
		, opts = {
			method: xhr.method
		}

		if (proto === "http" || proto === "https") {
			require(proto).request(url, opts, function(res) {
				head(res.statusCode, res.statusMessage, res.headers)
				res.on("data", body)
				res.on("end", done)
			}).end(data)
			return
		}
		if (proto === "data") {
			var match = dataUrlRe.exec(url)
			if (!match) throw Error("Invalid URL: " + url)
			setTimeout(function() {
				head(200, "OK", { "content-type": match[1] || "text/plain" })
				body(match[2] ? Buffer.from(match[3], "base64") : unescape(match[3]))
				done()
			}, 1)
			return
		}

		throw Error("Unsuported protocol: " + proto)

		function head(code, text, headers) {
			xhr.status = code
			xhr.statusText = text
			xhr._headers = headers
			setState(xhr, xhr.HEADERS_RECEIVED)
		}
		function body(chunk) {
			xhr.responseText += chunk.toString("utf8")
			setState(xhr, xhr.LOADING)
		}
		function done() {
			setState(xhr, xhr.DONE)
		}
	}
}


module.exports = {
	XMLHttpRequest: XMLHttpRequest
}

