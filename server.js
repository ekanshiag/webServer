const net = require('net')
let req = {}
let res = {}

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
      req.method = requestLine.shift()
      req.uri = requestLine.shift()
      req.version = requestLine.shift()
      reqData = reqData.substring(requestLineEndIndex + 2)
      let headersEndIndex = reqData.indexOf('\r\n\r\n')
      headers = reqData.substring(0, headersEndIndex)
      parseHeaders(headers)
      if (req.method === 'GET') {
        getRequestHandler()
        c.write(makeResponse())
        c.end()
      } else if (req.method === 'POST') {
        req.body = reqData.substring(headersEndIndex + 4)
        verifyBodyLength(c)
      }
    } else if (getBody === 1) {
      req.body = req.body.concat(reqData)
      reqData = ''
      verifyBodyLength(c)
    }
  })
}).on('error', err => {
  console.log(err)
})

server.listen(3000, () => {
  console.log('server bound')
})

function getRequestHandler () {
  res.version = req.version
  res.status = '200'
  res.reason = 'OK'
  res.headers = {}
  if (Object.keys(req.headers).includes('Cache-Control')) {
    res['Cache-Control'] = req['Cache-Control']
  }
  res.body = 'GET request recieved!\n'
  res.headers['Content-Type'] = 'application/json'
  res.headers['Content-Length'] = res.body.length.toString()
}

function postRequestHandler () {
  console.log(req.body)
  let res = 'POST request received\n'
  return res
}

function verifyBodyLength (c) {
  if (req.body.length === Number(req.headers['Content-Length'])) {
    let res = postRequestHandler()
    c.write(res)
    c.end()
  } else if (req.body.length > Number(req.headers['Content-Length'])) {
    c.write('Invalid request')
    c.end()
  } else {
    c.setTimeout(3000)
    c.on('timeout', () => {
      c.write('Incomplete request')
      c.end()
    })
  }
}

function parseHeaders (headers) {
  let requestHeaders = {}
  headers = headers.split('\r\n')
  headers.forEach(header => {
    header = header.split(':')
    requestHeaders[header.shift()] = header.join(':').trim()
  })
  req.headers = requestHeaders
}

function makeResponse () {
  let resData = res.version + ' ' + res.status + ' ' + res.reason + '\r\n'
  for (let header in res.headers) {
    let headerLine = ''
    headerLine = header + ': ' + res.headers[header]
    resData += headerLine + '\r\n'
  }
  resData += '\r\n' + res.body
  res = {}
  return resData
}
