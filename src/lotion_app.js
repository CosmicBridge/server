
'use strict';

const axios = require('axios');
const config = require('config');
const lotion = require('lotion');

const helper = require('./helper');

// Development mode (for local testing without bitcoin network).
const IS_DEV_MODE = config.has('isDevelopmentMode') && config.isDevelopmentMode;
console.log('DEV_MODE', IS_DEV_MODE)

/*
 To register a Bitcoin deposit with Cosmic Bridge, call (TxId = the bitcoin transaction ID):
 curl http://localhost:PORT/txs -d '{"txHash": <TxId>, "command": "deposit"}
 Your address balance will be credited.

 To payout a balance of 3 satoshis onto ADDRESS1, just do:
 curl http://localhost:PORT/txs -d '{"from":"ADDRESS1", "amount":-3.0, "command": "withdraw"}'

 To make a microtransaction of 2 satoshis from ADDRESS1 to ADDRESS2, just do:
 curl http://localhost:PORT/txs -d '{"from":"ADDRESS1","to":"ADDRESS2","amount":2.0,"signature":"none", "command": "pay"}'
 or
 curl http://localhost:PORT/txs -d '{"from":"ADDRESS1","to":"ADDRESS2","amount":-2.0,"signature":"none", "command": "pay"}'

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
        wallet: {
          // We save the master wallet address on the chain. This is how clients know where to send their deposits
          masterAddress: helper.getInitialMasterWalletAddress()
        },
        // Accounts keeps track of credited balances for users based on BTC they have sent to the master address.
        deposits: {}, // keeps track of claimed deposit tx ids
        balances: {}, // map of { bitcoinAddress: <balance in Satoshis> }
        proofs: {} // map of { bitcoinAddress: <last proof of ownership used> }
    },
    // genesis: "genesis.json", // add genesis for production peers. Without a genesis block, the app will create a new GCI each time it's run.
    // keys: "key.json", // add keys for production peers.
    // Peers:[] is required for validators to connect to each other.
    // Add additional validators/peers here.
    peers: [],
    logtendermint: config.logtendermint || false,
    tendermintPort: 46657,
    p2pPort: 46661,
    devMode: true
});

async function getState() {
    return axios.get(`http://localhost:${config.lotionPort}/state`).then(res => res.data)
}

app.use(async (state, tx) => {
    console.log('tx', tx);
    switch (tx.command) {
        // User wants to register a particular transaction to the masteraddress as a deposit into the payment zone network.
        // In the future, we could consider watching the bitcoin transactions to our master address ourselvs and not leaving
        // this to the user. However, it seems prudent to have this on the blockchain so we can have reproducible history
        // that can be cross-verified with the bitcoin blockchain
        case 'deposit':
            if (typeof tx.txHash === 'string') {
                console.log('Deposit request for ' + tx.txHash);
                if (IS_DEV_MODE) {
                    // Allow simulated deposits in development
                    helper.deposit(state, tx.to, tx.amount, tx.txHash);
                    return;
                }

                const bcoinTx = await helper.getTransaction(tx.txHash);
                // Extract an amount (if present) addressed to the master address;
                const transaction = helper.processDepositTransaction(bcoinTx, state.wallet.masterAddress);
                if (transaction.amount > 0) {
                    console.log(`Balance added for an amount of ${transaction.amount} satoshis from ${transaction.from}.`);
                    // Claim deposit and register on cosmicbridge.
                    helper.deposit(state, transaction.from, transaction.amount, tx.txHash);
                } else {
                    console.warn(`Transaction is not to ${helper.getMasterWalletAddress()} or has already been claimed`);
                }
            }
            break;
        case 'withdraw':
            // User wants to withdraw funds from the payment zone into his/her bitcoin account.
            if (typeof tx.amount === 'number' && typeof tx.from === 'string' && typeof tx.signature === 'string') {
                console.log(`Withdrawal request for ${tx.amount} from ${tx.from}`);
                if (tx.amount > 0) {
                    if (IS_DEV_MODE) {
                        helper.addBalance(state, tx.from, -tx.amount);
                        return;
                    }

                  // Validate ownership of Bitcoin (we don't want to allow attacks where someone empties someone else's balance,
                  // costing them tranasction fees, even though they won't receive the bitcoin themselves)
                  const isOwner = helper.processBitcoinOwnershipProof(state, tx.from, tx.signature);

                  if (isOwner)
                    helper.payout(state, tx.from, tx.amount);
                  else
                    console.warn('Withdrawal request rejected - failed to prove ownership');
                }
            }
            break;
        case 'pay':
            // User wants to send funds from within the payment zone to another address.
            if (typeof tx.from === 'string' && typeof tx.to === 'string' && typeof tx.amount === 'number' && typeof tx.signature === 'string') {
                console.log(`Payment request to pay from ${tx.from} an amount of ${tx.amount} satoshis to ${tx.to}.`);

                if (IS_DEV_MODE) {
                    helper.microTransact(state, tx.from, tx.to, tx.amount);
                    return;
                }

                // Sender should pass in a proof for actual ownership of that bitcoin address
                const isOwner = helper.processBitcoinOwnershipProof(state, tx.from, tx.signature);
                if (isOwner && helper.microTransact(state, tx.from, tx.to, tx.amount)) {
                    console.log('Success');
                } else {
                    console.warn("Failed, not enough balance or invalid signature given");
                }
            }
            break;
        default:
            console.warn('No known command given');
            break;
    }
});

function startBlockchainNode() {
  const {GCI} = app.listen(config.lotionPort).then(({GCI}) => {
      console.log('Cosmic Bridge lotion HTTP API listening on port:', config.lotionPort);
      // App identifier.
      console.log('GCI:', GCI);
  }).catch(e => {
      console.error('error starting app' ,e);
  });
}

module.exports = { startBlockchainNode, getState };
