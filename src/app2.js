let lotion = require('lotion')

let app = lotion({
  initialState: {
    genesis:'genesis.json',
    count: 0
  }
})

app.use(function (state, tx) {
  if(state.count === tx.nonce) {
    state.count++
  }
})

app.listen(3000)