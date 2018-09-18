async function* test () {
  let i = 0
  while(1) {
    yield i++
  }
}

async function* get () {
  let i = test()
  
}