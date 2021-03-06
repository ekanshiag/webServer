let httpStatusAndMime = require('./httpResponseStatus')
let httpStatus = httpStatusAndMime.httpStatus
let mimeType = httpStatusAndMime.httpMimeTypes

let res = {
  version: '',
  status: '',
  reason: '',
  headers: {},
  socket: ''
}

module.exports = res

res.setStatus = function (newStatus) {
  this.status = newStatus
  this.reason = httpStatus[newStatus]
}

res.setContentType = function (type) {
  this.headers['Content-Type'] = mimeType[type]
}

res.getResponseStr = function () {
  let resStr = this.version + ' ' + this.status + ' ' + this.reason + '\r\n'
  for (let header of Object.keys(this.headers)) {
    resStr += header + ': ' + this.headers[header] + '\r\n'
  }
  resStr += '\r\n'
  return resStr
}

res.send = function (body) {
  this.socket.write(JSON.stringify(body))
  this.socket.end()
}

res.addHeaders = function (headers) {
  this.headers = headers
}
