let lotion = require('lotion')

let app = lotion({
  initialState: {
    genesis:'/home/cosmicbridge/.lotion/networks/c85a3b9f8cf799670c1ab9e13ab0e530e6e0e463185d1d8010eda6d279c692d2/genesis.json',
    count: 0
  }
})

app.use(function (state, tx) {
  if(state.count === tx.nonce) {
    state.count++
  }
})

app.listen(3000)