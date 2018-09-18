const net = require('net')
let request = require('./request')
let response = require('./response')
let handlers = [methodHandler]
let routes = {
  'GET': [],
  'POST': []
}
let methods = ['GET', 'POST']

function createServer (port) {
  const server = net.createServer(client => {
    console.log('Client connected')
    runServer(client)
    client.on('error', err => console.error(err))
    client.on('end', () => console.log('Client connection ended'))
    client.on('timeout', () => closeConnection(client, '408'))
  })
  server.listen(port)
}

async function runServer (client) {
  let req = Object.create(request)
  let i = await getRequest(client)
  console.log(i.next())
  req = await i.next().value
  console.log(req)
  if (wantBody(await req)) {
    req.body = !checkContentLenHeader(req)
      ? closeConnection(client, '411')
      : verifyAndGetBody(req, i)
  }
  createResponseAndRunHandlers(req)
}

async function* getRequest (client) {
  let dataBuffer = Buffer.from([])
  client.on('data', c => {
    console.log(c)
    dataBuffer += c
    if (checkForHeaders(dataBuffer)) {
      yield await getHeaders(dataBuffer).shift()
      let headersEnd = dataBuffer.indexOf('\r\n\r\n')
      dataBuffer = dataBuffer.slice(headersEnd + 4)
      while(1) yield dataBuffer
    }
  })
  //console.log(dataBuffer.toString())
    
}

function checkForHeaders (buffer) { return buffer.toString().includes('\r\n\r\n') }
function splitLines (data, ch) { return data.split(ch) }
function wantBody (req) { return req.method === 'POST' }
function checkContentLenHeader (req) { return req.headers.hasOwnProperty('Content-Length') }
function checkBodyLength (req, buffer) {
  return Buffer.byteLength(buffer) === Number(req.headers['Content-Length'])
    ? 0
    : Buffer.byteLength(buffer) > Number(req.headers['Content-Length'])
      ? 1
      : -1
}

function verifyAndGetBody (req, i, client) {
  let buffer = i.next().value
  switch (checkBodyLength(req, buffer)) {
    case 0: return parseBody(req, buffer)
    case 1: closeConnection(client, '413')
      return
    case -1: waitForBody(client)
      verifyAndGetBody(req, i, client)
  }
}

function closeConnection (client, status) {
  client.write('Closing connection with status ' + status)
  client.end()
}

function waitForBody (client) {
  client.setTimeout(3000)
}

function parseBody (req, buffer) {
  switch (req.headers['Content-Type']) {
    case 'application/json': return JSON.parse(buffer.toString())
      break
    case 'application/x-www-form-urlencoded': return parseUrl(buffer)
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

function parseReqLine (req, buffer) {
  let reqLine = splitLines(buffer.toString(), '\r\n')[0]
  let length = reqLine.length
  reqLine = splitLines(reqLine, ' ')
  req.method = reqLine[0]
  req.uri = reqLine[1]
  req.version = reqLine[2]
  return [req, buffer.slice(length + 2)]
}

function separateHeaders (req, buffer) { return [req, buffer.slice(0, buffer.indexOf('\r\n\r\n'))] }

function parseHeaders (req, buffer) {
  let headers = splitLines(buffer.toString(), '\r\n')
  for (let header of headers) {
    let x = splitLines(header, ':')
    req.headers[x.shift()] = x.join(':').trim()
  }
  return [req, buffer]
}

function normaliseHeaders (req, buffer) {
  return [req, Buffer.from(buffer.toString().replace('content-type', 'Content-Type')
    .replace('content-length', 'Content-Length'))]
}

function pipe (...fns) {
  return function (req, buffer) {
    fns.forEach(fn => {
      [req, buffer] = fn(req, buffer)
    })
    return [req, buffer]
  }
}

let getHeaders = pipe(parseReqLine, separateHeaders, normaliseHeaders, parseHeaders)
let dataBuffer = Buffer.from([])
let getBody = 0

function handleConnection (req, datachunk, client) {
  dataBuffer += datachunk
  if (checkForHeaders(dataBuffer) && getBody === 0) {
    [req, buff] = getHeaders(req, dataBuffer)
    if (wantBody(req)) {
      let headersEnd = dataBuffer.indexOf('\r\n\r\n')
      dataBuffer = dataBuffer.slice(headersEnd + 4)
      getBody = 1
    } else {
      createResponseAndRunHandlers(req)
    }
  }
  if (getBody === 1) {
    checkContentLenHeader(req)
      ? verifyAndGetBody(req, dataBuffer, client)
      : closeConnection(client, '411')
  }
  console.log(req)
}

function createResponseAndRunHandlers (req) {
  let res = Object.create(response)
  res.addHeaders(req.headers)
  next(req, res)
}

function next (req, res) {
  let handler = handlers.shift()
  handler(req, res)
}

function addHandler (handler) {
  handlers.push(handler)
}

function addRoute (method, route) {
  routes[method].push(route)
}

function methodHandler (req, res) {
  methods.forEach(method => {
    if (req.method === method) {
      if (!routes[method].includes(req.uri)) {
        closeConnection('400')
      }
    }
  })
}

module.exports = [
  setUpConnection,
  addHandler,
  addRoute
]

createServer()
