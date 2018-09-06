const net = require('net')
let requestLine = ''
let headers = ''
let body = ''

const server = net.createServer(c => {
  console.log('Client connected')
  let req = ''
  let getBody = 0
  c.on('end', () => {
    console.log('Client connection ended')
  })
  c.on('error', err => {
    throw Error(err)
  })
  c.on('data', (data) => {
    req = req.concat(data.toString())
    if (getBody === 0 && req.includes('\r\n\r\n')) {
      let requestLineEndIndex = req.indexOf('\r\n')
      requestLine = req.substring(0, requestLineEndIndex)
      req = req.substring(requestLineEndIndex + 2)
      let headersEndIndex = req.indexOf('\r\n\r\n')
      headers = req.substring(0, headersEndIndex)
      console.log(headers, '\n\n')
      if (requestLine.startsWith('GET')) {
        let res = getRequestHandler()
        c.write(res)
        c.end()
      } else if (requestLine.startsWith('POST')) {
        body = req.substring(headersEndIndex + 4)
        req = ''
        getBody = 1
      }
    } else if (getBody === 1) {
      body = body.concat(req)
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