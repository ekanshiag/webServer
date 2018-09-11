const net = require('net')
let req = {}

function checkForHeaders (buffer) { return buffer.toString().includes('\r\n\r\n') }
function splitLines (data, ch) { return data.split(ch) }
function wantBody () { return req.method === 'POST' }
function checkContentLenHeader () { return req.headers.hasOwnProperty('Content-Length') }
function checkBodyLength (buffer) {
  return Buffer.byteLength(buffer) === Number(req.headers['Content-Length'])
    ? 0
    : Buffer.byteLength(buffer) > Number(req.headers['Content-Length'])
      ? 1
      : -1
}

function verifyAndGetBody (buffer, client) {
  switch (checkBodyLength(buffer)) {
    case 0: parseBody(buffer)
      break
    case 1: closeConnection(client, '413')
      break
    case -1: waitForBody(client)
      break
  }
}

function closeConnection (client, status) {
  client.write('Closing connection with status ' + status)
  client.end()
}

function waitForBody (client) {
  client.setTimeout(3000)
}

function parseBody (buffer) {
  switch (req.headers['Content-Type']) {
    case 'application/json': req.body = JSON.parse(buffer.toString())
      break
    case 'application/x-www-form-urlencoded': req.body = parseUrl(buffer)
      break
  }
}

function parseUrl (buffer) {
  let obj = {}
  let args = splitLines(buffer.toString(), '&')
  args.forEach(arg => {
    let x = splitLines(arg, '=')
    obj[x[0]] = x[1]
  })
  return obj
}

function makeRequestObject () {
  req = {
    method: '',
    uri: '',
    version: '',
    headers: {},
    handlers: []
  }
}

function setUpConnection () {
  const server = net.createServer(client => {
    makeRequestObject()
    console.log('Client connected')
    client.on('error', err => console.error(err))
    client.on('end', () => console.log('Client connection ended'))
    client.on('data', datachunk => handleConnection(datachunk, client))
    client.on('timeout', () => closeConnection(client, '408'))
  })
  server.listen(3000)
}

function parseReqLine (buffer) {
  let reqLine = splitLines(buffer.toString(), '\r\n')[0]
  let length = reqLine.length
  reqLine = splitLines(reqLine, ' ')
  req.method = reqLine[0]
  req.uri = reqLine[1]
  req.version = reqLine[2]
  return buffer.slice(length + 2)
}

function separateHeaders (buffer) { return buffer.slice(0, buffer.indexOf('\r\n\r\n')) }

function parseHeaders (buffer) {
  let headers = splitLines(buffer.toString(), '\r\n')
  for (let header of headers) {
    let x = splitLines(header, ':')
    req.headers[x.shift()] = x.join(':').trim()
  }
}

function normaliseHeaders (buffer) {
  return Buffer.from(buffer.toString().replace('content-type', 'Content-Type')
    .replace('content-length', 'Content-Length'))
}

function pipe (...fns) {
  return function (buffer) {
    fns.forEach(fn => {
      buffer = fn(buffer)
    })
  }
}

let getHeaders = pipe(parseReqLine, separateHeaders, normaliseHeaders, parseHeaders)
let dataBuffer = Buffer.from([])
let getBody = 0

function handleConnection (datachunk, client) {
  dataBuffer += datachunk
  if (checkForHeaders(dataBuffer) && getBody === 0) {
    getHeaders(dataBuffer)
    if (wantBody()) {
      let headersEnd = dataBuffer.indexOf('\r\n\r\n')
      dataBuffer = dataBuffer.slice(headersEnd + 4)
      getBody = 1
    }
  }
  if (getBody === 1) {
    checkContentLenHeader()
      ? verifyAndGetBody(dataBuffer, client)
      : closeConnection(client, '411')
  }
  console.log(req)
}

setUpConnection()
