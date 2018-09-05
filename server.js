const net = require('net')

const server = net.createServer(c => {
  console.log('Client connected')
  c.on('end', () => {
    console.log('Client connection ended')
  })
  c.on('error', err => {
    throw Error(err)
  })
  c.on('data', (data) => {
    c.write(data)
    c.end()
  })
}).on('error', err => {
  console.log(err)
})

server.listen(3000, () => {
  console.log('server bound')
})
