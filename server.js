const net = require('net')
const server = net.createServer(c => {
  console.log('Client connected')
  c.on('end', () => {
    console.log('Client connection ended')
  })
  c.on('error', err => {
    throw Error(err)
  })
  c.write('hello')
  c.on('data', (data) => {
    c.write(data)
  })
}).on('error', err => {
  console.log(err)
})

server.listen(80, () => {
  console.log('server bound')
})
