const axios = require('axios');
const lotion = require('lotion');
const schedule = require('node-schedule');

const bridge = require('./bridge');

const BASE_URL = process.env.COSMOS_BRIDGE_URL || 'http://localhost';
const PORT = process.env.COSMOS_BRIDGE_PORT || 3000;


// Configurable recurrence rule for running payout job.
// Currently set for every Sunday at 5:00pm.
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0];
rule.hour = 17;
rule.minute = 0;

let payoutJob;

/*
  To load a balance of 3 satoshis onto ADDRESS1, just do:
    curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "val":3.0}'

  To payout a balance of 3 satoshis onto ADDRESS1, just do:
    curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "val":-3.0}'

  To make a microtransaction of 2 satoshis from ADDRESS1 to ADDRESS2, just do:
    curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","val":2.0}'

  To check the balance of ADDRESS1, just do:
    curl http://localhost:PORT/state
    Which returns a JSON dictionary, and then use the key 'balances' and then key 'ADDRESS1' to get the balance for ADDRESS1

  WALLET is the single wallet tied to the server and should be secured
  such that nobody can access the private key, and only the APP and the
  validators running the APP can perform transactions on the bitcoin 
  blockchain with the WALLET

  BALANCES is a dictionary of a UID (unique identifier or public key) to the amount of 
  bitcoin tied to that balance.

  PAYMENTS is a an array for payments that will be settled (cleared) at the end of the next payment period.
*/

let app = lotion({
    // lotion options
    initialState: {
        wallet: {},
        // Accounts keeps track of credited balances for users based on BTC they have sent to the master address.
        balances: {},// map of bridgeAddress: {bitcoinAddress: ..., credit: ...}
        // These are the payments that will be settled (cleared) at the end of the next payment period.
        payments: [], // list of {amount: ..., receiverAddress: ..., senderAddress: ...}
        networkfee: 0.001 // Currently a constant
    },
    devMode: true
});

app.use((state, tx) => {
    if (typeof tx.address === 'string' && typeof tx.val === 'number') {
      // TODO Add transaction hash checking for validator number to make sure that the balance is actually loaded to the server wallet
      if (tx.val > 0) {
        console.log(`Balance added for an amount of ${tx.val} satoshis from ${tx.address}.`);
        loadBalance(state, tx.address, "bcointransactionhash", tx.val)
      } else if (tx.val < 0) {
        console.log(`Balance paid out for an amount of ${tx.val} satoshis to ${tx.address}.`);
        payout(state, tx.address, "bcointransactionhash", tx.val)
      } else {
        console.log('This is a fake POST call')
        // TODO block fake post calls to prevent server slowdown
      }
    } else if (typeof tx.fromAddress === 'string' && typeof tx.toAddress === 'string' && typeof tx.val === 'number') {
      console.log(`Payment order received for an amount of ${tx.val} satoshis from ${tx.fromAddress} to ${tx.toAddress}.`);
      // TODO Validate proof of ownership of the address on behalf of the sender - should be in the payload. Also must be sent over HTTPS
      if (microTransact(state, tx.fromAddress, tx.toAddress, tx.val)) {
        console.log('Success')
      } else {
        console.log("Failed, not enough balance or invalid address given")
      }
    }
  })

  app.listen(PORT).then(({GCI}) => {
    console.log('CosmosBridge app running on port:', PORT);
    // App identifier.
    console.log('GCI:', GCI);
    //payoutJob = schedule.scheduleJob(rule, payoutTask);
});


function getState() {
    return axios.get(`${BASE_URL}:${PORT}/state`).then(res => res.data)
}

// settle/combine payments for minimal net BTC transactions from the lotion app state.
function payoutTask() {
    console.log('running payoutTask');
    getState().then((state) => {
        console.log('current state', state);
        const paymentMap = bridge.groupPayments(state.payments);
        const receivers = Object.keys(paymentMap);
        receivers.map((receiverAddress) => {
            // Distribute best-aggregated credits to users.
            // TODO: Once credit successful, remove from payments app state.
            bridge.creditBitcoinToReceiver(paymentMap[receiverAddress], receiverAddress);
        });
    });
}


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
  function deltaBalance(state, uid, delta) {
    state.balances[uid] = state.balances[uid] + delta
  }
  
  /*
    Perform a microtransaction from wallet of UIDPAYER to wallet of
    UIDRECEIVER for the amount of bitcoin VAL. Return true if successful
  */
  function microTransact(state, uidPayer, uidReceiver, val) {
    if (checkBalance(state, uidPayer, val)) {
      deltaBalance(state, uidPayer, -1*val)
      deltaBalance(state, uidReceiver, val)
      return true
    }
    return false
  }
  
  /*
    Checks the balance to make sure that the wallet of UID has at least
    VAL bitcoin
  */
  function checkBalance(state, uid, val) {
    if (state.balances[uid] && state.balances[uid] >= Math.abs(val)) {
      return true
    }
    return false
  }
  
  /*
    If UID does not exist, adds it to the wallet. Otherwise, checks the bcoin
    chain until TRANSACTIONHA
  */
  function loadBalance(state, uid, bcointransactionhash, val) {
    if (state.balances[uid]) {
      deltaBalance(state, uid, val)
    } else {
      state.balances[uid] = val
    }
  }
  
  /*
    Performs a transaction on the bitcoin blockchain to payout to UID for
    VAL and makes sure that the transaction goes through
  */
  function payout(state, uid, bcointransactionhash, val) {
    if (checkBalance(state, uid, val)) {
      deltaBalance(state, uid, val)
    } else {
      console.log("Not enough funds")
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
  