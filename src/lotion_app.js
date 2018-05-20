
'use strict';

const axios = require('axios');
const lotion = require('lotion');
const schedule = require('node-schedule');

const helper = require('./helper');

/*
 To load a balance of 3 satoshis onto ADDRESS1, just do:
 curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "val":3.0}'

 To payout a balance of 3 satoshis onto ADDRESS1, just do:
 curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "val":-3.0}'

 To make a microtransaction of 2 satoshis from ADDRESS1 to ADDRESS2, just do:
 curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","val":2.0}'
 or
 curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","val":-2.0}'

 To check the balance of ADDRESS1, just do:
 curl http://localhost:PORT/state
 Which returns a JSON dictionary, and then use the key 'balances' and then key 'ADDRESS1' to get the balance for ADDRESS1

 WALLET is the single wallet tied to the server and should be secured
 such that nobody can access the private key, and only the APP and the
 validators running the APP can perform transactions on the bitcoin
 blockchain with the WALLET

 balances: dictionary of a UID (unique identifier or public key) to the amount of bitcoin (in satoshis) tied to that balance.

 */

let app = lotion({
    // lotion options
    initialState: {
        wallet: {},
        // Accounts keeps track of credited balances for users based on BTC they have sent to the master address.
        balances: {},// map of bridgeAddress: {bitcoinAddress: ..., credit: ...}. This gets settled each week.
        networkfee: 0.001, // Currently a constant
    },
    devMode: true
});

function getState(port) {
    return axios.get(`http://localhost:${port}/state`).then(res => res.data)
}

app.use((state, tx) => {
    if (typeof tx.address === 'string' && typeof tx.val === 'number') {
        // TODO: Add transaction hash checking for validator number to make sure that the balance is actually loaded to the server wallet
        if (tx.val > 0) {
            console.log(`Balance added for an amount of ${tx.val} satoshis from ${tx.address}.`);
            helper.addBalance(state, tx.address, tx.val)
        } else if (tx.val < 0) {
            console.log(`Balance paid out for an amount of ${tx.val} satoshis to ${tx.address}.`);
            helper.payout(state, tx.address, tx.val)
        } else {
            console.log('This is a fake POST call')
            // TODO: block fake post calls to prevent server slowdown
        }
    } else if (typeof tx.fromAddress === 'string' && typeof tx.toAddress === 'string' && typeof tx.val === 'number') {
        console.log(`Payment order received for an amount of ${tx.val} satoshis from ${tx.fromAddress} to ${tx.toAddress}.`);
        // TODO: Validate proof of ownership of the address on behalf of the sender - should be in the payload. Also must be sent over HTTPS
        if (helper.microTransact(state, tx.fromAddress, tx.toAddress, tx.val)) {
            console.log('Success')
        } else {
            console.log("Failed, not enough balance or invalid address given")
        }
    }
});

function startBlockchainNode(port) {
  app.listen(port).then(({GCI}) => {
      console.log('Cosmic Bridge lotion HTTP API listening on port:', port);
      // App identifier.
      console.log('GCI:', GCI);
  });
}

module.exports = { startBlockchainNode, getState };
