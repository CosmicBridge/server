/*
  To load a balance of 3 BTC onto ADDRESS1, just do:
    curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "val":3.0}'

  To make a microtransaction of 2 BTC from ADDRESS1 to ADDRESS2, just do:
    curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","val":2.0}'

  To check the balance of ADDRESS1, just do:
    curl http://localhost:PORT/state
    Which returns a JSON dictionary, and then use the key 'balances' and then key 'ADDRESS1' to get the balance for ADDRESS1

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
    //wallet: intializeWallet(),
    wallet: {},
    balances: {},
    userwallets:{},
    scheduledpayout: {},

  },
  devMode: true
})

app.use((state, tx) => {
  if (typeof tx.address === 'string' && typeof tx.val === 'number') {
    console.log(`Balance loaded for an amount of ${tx.val} satoshis from ${tx.address}.`);
    // TODO Add transaction hash checking for validator number to make sure that the balance is actually loaded to the server wallet
    loadBalance(tx.address, "bcointransactionhash", tx.val)
  } else if (typeof tx.fromAddress === 'string' && typeof tx.toAddress === 'string' && typeof tx.val === 'number') {
    console.log(`Payment order received for an amount of ${tx.val} satoshis from ${tx.fromAddress} to ${tx.toAddress}.`);
    // TODO Validate proof of ownership of the address on behalf of the sender - should be in the payload. Also must be sent over HTTPS
    if (microTransact(tx.fromAddress, tx.toAddress, tx.val)) {
      console.log('Success')
    } else {
      console.log("Failed, not enough balance or invalid address given")
    }
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
  if (balances[uid] && balances[uid] >= val) {
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
  //return AESencrypt('/home/.wallet/bcoinprivkey')
}

/*
  This function decrypts the wallet to get the privatekey. Need to make
  sure that this part is not able to be debugged so that the privatekey
  cannot be reverse engineered. If bcoin has some sort of functinoality
  that can replace this, that would be best
*/
function decryptWallet() {
  //return AESdecrypt(wallet)
}

/*
  Performs a transaction on the bitcoin blockchain to payout to UID for
  VAL and makes sure that the transaction goes through
*/
function payout(UID, val) {
  
}

app.listen(3000)
