

var DOM = require(".")
, parser = new DOM.DOMParser()

function XMLHttpRequest() {}

function setState(xhr, state) {
	if (xhr.readyState !== state) {
		xhr.readyState = state
		if (xhr.onreadystatechange) xhr.onreadystatechange()
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
		console.log("Mime", mime)
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
	open: function (method, url, async) {
		var xhr = this
		if (async === false) throw Error("Not implemented: async == false")

		if (xhr.readyState > xhr.UNSENT) {
			xhr.abort()
		}

		xhr.method = method
		xhr.responseURL = url
		setState(xhr, xhr.OPENED)
	},
	send: function (data) {
		var xhr = this
		, proto = xhr.responseURL.split(":")[0]
		, opts = {
			method: xhr.method
		}
		, req = require(proto).request(xhr.responseURL, opts, function(res) {
			xhr.status = res.statusCode
			xhr.statusText = res.statusMessage
			xhr._headers = res.headers

			res.on("data", function(chunk) {
				xhr.responseText += chunk.toString("utf8")
				setState(xhr, xhr.LOADING)
			})

			res.on("end", function() {
				setState(xhr, xhr.DONE)
				if (xhr.onload) xhr.onload()
			})

			setState(xhr, xhr.HEADERS_RECEIVED)
		})

		req.end(data)
	}
}


module.exports = {
	XMLHttpRequest: XMLHttpRequest
}

