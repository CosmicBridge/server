let shea = require('shea')
let app = require('lotion')({
  initialState: { messages: [] },
  devMode: true
})

app.use((state, tx) => {
  if (typeof tx.username === 'string' && typeof tx.message === 'string') {
    state.messages.push({ username: tx.username, message: tx.message })
  } else if (typeof tx.username === 'string' && typeof tx.message === 'number') {
    temp = tx.message
    temp = temp + 1
    state.messages.push({ username: tx.username, message: temp })
  }
})

app.use(shea('public/'))

app.listen(3000)
