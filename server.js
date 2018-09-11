const net = require('net')
let req = {}

function checkForHeaders (buffer) { return buffer.toString().includes('\r\n\r\n') }
function splitLines (data, ch) { return data.split(ch) }

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
    client.on('data', datachunk => handleConnection(datachunk))
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

function pipe (...fns) {
  return function (buffer) {
    fns.forEach(fn => {
      buffer = fn(buffer)
    })
  }
}

let getHeaders = pipe(parseReqLine, separateHeaders, parseHeaders)
let dataBuffer = Buffer.from([])

function handleConnection (datachunk) {
  dataBuffer += datachunk
  if (checkForHeaders(dataBuffer)) {
    getHeaders(dataBuffer)
    console.log(req)
  }
}

setUpConnection()
