const net = require('net')
let req = {}

const server = net.createServer(c => {
  console.log('Client connected')
  let reqData = ''
  let getBody = 0
  let requestLine = ''
  let headers = ''

  c.on('end', () => {
    console.log('Client connection ended')
  })
  c.on('error', err => {
    throw Error(err)
  })
  c.on('data', (data) => {
    reqData = reqData.concat(data.toString())
    if (getBody === 0 && reqData.includes('\r\n\r\n')) {
      let requestLineEndIndex = reqData.indexOf('\r\n')
      requestLine = reqData.substring(0, requestLineEndIndex)
      requestLine = requestLine.split(' ')
      // [req.method, req.uri, req.version] = requestLine
      req.method = requestLine.shift()
      req.uri = requestLine.shift()
      req.version = requestLine.shift()
      reqData = reqData.substring(requestLineEndIndex + 2)
      let headersEndIndex = reqData.indexOf('\r\n\r\n')
      headers = reqData.substring(0, headersEndIndex)
      parseHeaders(headers)
      console.log(req)
      if (req.method === 'GET') {
        let res = getRequestHandler()
        c.write(res)
        c.end()
      } else if (req.method === 'POST') {
        req.body = reqData.substring(headersEndIndex + 4)
        reqData = ''
        getBody = 1
      }
    } else if (getBody === 1) {
      req.body = req.body.concat(reqData)
    }
  })
}).on('error', err => {
  console.log(err)
})

server.listen(3000, () => {
  console.log('server bound')
})

function getRequestHandler () {
  let res = 'GET request received\n'
  return res
}

function postRequestHandler (req) {
  let data = req.split('\r\n').pop()
  console.log(data)
  console.log(data.length)
  return req
}

function verifyBodyLength () {

}

function parseHeaders (headers) {
  headers = headers.split('\r\n')
  headers.forEach(header => {
    header = header.split(':')
    req[header.shift()] = header.join(':').trim()
  })
}
