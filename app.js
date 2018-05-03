let shea = require('shea')

/*
  WALLET is the single wallet tied to the server and should be secured
  such that nobody can access the private key, and only the APP and the
  validators running the APP can perform transactions on the bitcoin 
  blockchain with the WALLET

  BALANCES is a dictionary of a UID (unique identifier) to the amount of 
  bitcoin tied to that balance.

  USERWALLETS is a dictionary with keys as a UID(unique identifier) and
  values as the bitcoin private key

  SCHEDULEDPAYOUTS is a dictionary with keys as a date and the value as
  a UID with amount to pay
*/

//Need to see how javascript handles public final constant for fee
networkfee = 0.001

let app = require('lotion')({
  initialState: {
    wallet: intializeWallet(),
    balances: {},
    userwallets:{},
    scheduledpayout: {},

  },
  devMode: true
})

app.use((state, tx) => {
  if (typeof tx.username === 'string' && typeof tx.message === 'string') {
    state.messages.push({ username: tx.username, message: tx.message })
  }
})

/*
  BCOINTRANSACTIONHASH is a string representing the transaction hash of
  the initiated transaction. Queries bcoin server and if the NUMVALIDATORS
  is satisfied, return true. Otherwise, return false
*/
function checkBcoinChain(bcointransactionhash, numValidators) {
  return true
}

/*
  Changes the balance of UID by DELTA. DELTA may be negative
*/
function deltaBalance(uid, delta) {
  balances[uid] = balances[uid] + delta
}

/*
  Perform a microtransaction from wallet of UIDPAYER to wallet of
  UIDRECEIVER for the amount of bitcoin VAL. Return true if successful
*/
function microTransact(uidPayer, uidReceiver, val) {
  if (checkBalance(uidPayer)) {
    deltaBalance(uidPayer, -1*val)
    deltaBalance(uidReceiver, val)
    return true
  }
  return false
}

/*
  Checks the balance to make sure that the wallet of UID has at least
  VAL bitcoin
*/
function checkBalance(uid, val) {
  if (balances[uid] >= val) {
    return true
  }
  return false
}

/*
  If UID does not exist, adds it to the wallet. Otherwise, checks the bcoin
  chain until TRANSACTIONHA
*/
function loadBalance(uid, bcointransactionhash, val) {
  if (balances[uid]) {
    deltaBalance(uid, val)
  } else {
    balances[uid] = val
  }
}

/*
  If bcoin doesn't have a way to do private key encryption and decryption
  then will need to implement ourselves using AES. This function will
  only be called once by the node that initializes the APP. However, this
  isn't very secure since the users of the node that initializes the chain
  has access to the private key (which will be the bcoin server). 
  Maybe make this a multi-sig wallet that gets created from BCOIN and give
  access to all APP validators?
*/
function initializeWallet() {
  return AESencrypt('/home/.wallet/bcoinprivkey')
}

/*
  This function decrypts the wallet to get the privatekey. Need to make
  sure that this part is not able to be debugged so that the privatekey
  cannot be reverse engineered. If bcoin has some sort of functinoality
  that can replace this, that would be best
*/
function decryptWallet() {
  return AESdecrypt(wallet)
}

/*
  Performs a transaction on the bitcoin blockchain to payout to UID for
  VAL and makes sure that the transaction goes through
*/
function payout(UID, val) {
  
}


app.use(shea('public/'))

app.listen(3000)
