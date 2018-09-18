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
  this.res.headers['Content-Type'] = mimeType[type]
}

res.getResponseStr = function () {
  let resStr = this.res.version + ' ' + this.res.status + ' ' + this.res.reason + '\r\n'
  for (let header of Object.keys(this.res.headers)) {
    resStr += header + ': ' + this.res.headers[header] + '\r\n'
  }
  resStr += '\r\n'
  return resStr
}

res.send = function (body) {
  res.socket.write(JSON.stringify(body))
  res.socket.end()
}

res.addHeaders = function (headers) {
  this.res.headers = headers
}
