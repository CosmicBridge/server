
'use strict';

const axios = require('axios');
const config = require('config');
const lotion = require('lotion');

const secp256k1 = require('secp256k1'); // Elliptic curve cryptography lib

const Message = require('bitcore-message');
const helper = require('./helper');

// Development mode
const IS_DEV_MODE = config.has('isDevelopmentMode') && config.isDevelopmentMode;

/*
 To load a balance of 3 satoshis onto ADDRESS1, just do:
 curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "val":3.0}'

 To payout a balance of 3 satoshis onto ADDRESS1, just do:
 curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "val":-3.0}'

 To make a microtransaction of 2 satoshis from ADDRESS1 to ADDRESS2, just do:
 curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","val":2.0,"proofOfOwnership":"none"}'
 or
 curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","val":-2.0,"proofOfOwnership":"none"}'

 Of coures, 'none' as proofOfOwnership will only work in development.
 In production, put in the TXID of the Bitcoin deposit transaction, signed with the originating address' private key.

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
        deposits: {}, // keeps track of claimed deposit tx ids.
        balances: {}, // map of {bitcoinAddress: ..., credit: Y}.
        networkfee: 0.001, // Currently a constant
    },
    devMode: true
});

async function getState() {
    return axios.get(`http://localhost:${config.lotionPort}/state`).then(res => res.data)
}

app.use(async (state, tx) => {
    console.log('tx', tx);
    switch (tx.command) {
        case 'deposit':
            if (typeof tx.depositId === 'string') {
                console.log('Deposit request for ' + tx.depositId);
                if (IS_DEV_MODE) {
                    helper.deposit(state, tx.to, tx.amount, tx.depositId);
                    return;
                }

                const bcoinTx = await helper.getTransaction(tx.depositId);
                // Extract an amount (if present) addressed to the master address;
                const transaction = helper.processDepositTransaction(bcoinTx);
                if (transaction.amount > 0) {
                    console.log(`Balance added for an amount of ${transaction.amount} satoshis from ${transaction.from}.`);
                    // Claim deposit and register on cosmicbridge.
                    helper.deposit(state, transaction.from, transaction.amount, tx.depositId);
                } else {
                    console.log(`Transaction not to ${helper.MASTER_ADDRESS} or has already been claimed`);
                }
            }
            break;
        case 'withdraw':
            if (typeof tx.amount === 'number' && typeof tx.from === 'string') {
                console.log(`Withdrawl request for ${tx.amount} from ${tx.from}`);
                if (tx.amount > 0) {
                    if (IS_DEV_MODE) {
                        helper.addBalance(state, tx.from, -tx.amount)
                        return;
                    }

                    helper.payout(state, tx.from, tx.amount)
                }
            }
            break;
        case 'pay':
            console.log(`Tx request to pay from ${tx.from} an amount of ${tx.amount} satoshis to ${tx.to}.`);
            if (typeof tx.from === 'string' && typeof tx.to === 'string' && typeof tx.amount === 'number' && typeof tx.signature === 'string') {
                if (IS_DEV_MODE) {
                    helper.microTransact(state, tx.from, tx.to, tx.amount);
                    return;
                }

                // Sender should sign the string 'cosmicbridge' with his/her primary key and pass as signature here.
                const isValid = Message("cosmicbridge").verify(tx.from, tx.signature);
                if (isValid && helper.microTransact(state, tx.from, tx.to, tx.amount)) {
                    console.log('Success')
                } else {
                    console.log("Failed, not enough balance or invalid signature given")
                }
            }
            break;
        default:
            console.log('No command given');
            break;
    }
});

function startBlockchainNode() {
  const {GCI} = app.listen(config.lotionPort).then(({GCI}) => {
      console.log('Cosmic Bridge lotion HTTP API listening on port:', config.lotionPort);
      // App identifier.
      console.log('GCI:', GCI);
  });
}

module.exports = { startBlockchainNode, getState };
