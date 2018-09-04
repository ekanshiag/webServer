const net = require('net')

let client = net.createConnection({port: 80}, () => {
  console.log('Server connected')
  client.write('world!')
})

client.on('data', (data) => {
  console.log(data.toString())
})
