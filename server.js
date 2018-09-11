const net = require('net')
let req = {}

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
    client.on('connection', () => {
      makeRequestObject()
      console.log('Client connected')
    })
    client.on('error', err => console.error(err))
    client.on('end', console.log('Client connection ended'))
    client.on('data', datachunk => handleConnection(datachunk))
  })
  server.listen(3000)
}

function handleConnection (datachunk) {

}

setUpConnection()
