<p align="center">
  <img src="./img/cosmic_bridge.png" width="325"/>
</p>

Cosmic Bridge
---

[![Dependency Status](https://david-dm.org/CosmicBridge/server.svg)](https://david-dm.org/CosmicBridge/server)
[![devDependencies Status](https://david-dm.org/CosmicBridge/server/dev-status.svg)](https://david-dm.org/CosmicBridge/server?type=dev)

Server node for the Cosmic Bridge application. Manages tracking payments/balance on the Cosmos chain and bundled scheduled payouts on the Bitcoin mainnet.

For architectural overview, see here: https://docs.google.com/presentation/d/1-8MP2yRhTy7D1YDUiauJoJ1g_ppXQbRpk0YTQ0ZFEzw/edit#slide=id.g3772f84a12_0_18

### Concept

The Cosmic Bridge server node serves as a validator/facilitator of transactions.

The funds are stored in a multi-sig wallet ; any payment needs to be properly signed by a subset of the validators.

In order to participate in the Cosmic Bridge network, a user should send bitcoin to a particular payment zone address - a specific wallet on the Bitcoin blockchain. Once bitcoin has been received, users can micro-transact bitcoin on a Cosmos chain (this chain is the "payment zone"). The balances are paid out periodically or on-demand on the Bitcoin chain, vastly reducing the number of required transactions (and hence the transaction fees paid).

The end result is that users save transaction fees by bundling up transactions on the bitcoin network while still enjoying transparency and safety. In return, the complete trustlessness of the Bitcoin chain is exchanged with a degree of trust in the validator set of the payment zone. We believe this compromise is acceptable for many potential uses.

### Potential Uses

Cosmic Bridge can be used for any application that requires cheap, fast and auditable settlement of Bitcoin transactions, assuming on-demand Bitcoin-chain settlement is acceptable. Payment Zones can be free for anyone to join, or limited to certain parties. In theory, the longer users maintain and use the balances on the cosmos bridge network, the more optimizations can be done in terms of payment merging. Some potential applications:

* Bitcoin micropayments
* Dark pools of BTC liquidity between exchanges or large traders
* A merchant network supporting free bitcoin payments for participating merchants

### How it works:
* Create a new multisig wallet that will be used as the master address.
* Advertise the master address for users to contribute bitcoin to.
* Users can "credit" other users by invoking app transaction methods which will adjust the participant's balance on the app `state.balances` dictionary.
* Users can withdraw their balance at any time, at which point the app will optimize required payment settlements in order to pay out the user.

### Staking
Right now the system does not involve stake mechanics, since the idea is to rely on a trusted, well-known set of validators. In the future, staking mechanics, based on BTC staking or a native token, could be implemented easily as Cosmos supports them.

### Interacting with the Payment Zone or Lotion App:

Generally, connecting to the payment zone should be done via the Tendermint API. Following are a few examples you can run from the command line.

To load a balance of 3 satoshis onto ADDRESS1, just do:

  `curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "amount":3.0}'`
  
To payout a balance of 3 satoshis onto ADDRESS1, just do:

  `curl http://localhost:PORT/txs -d '{"address":"ADDRESS1", "amount":-3.0}'`
  
To make a microtransaction of 2 satoshis from ADDRESS1 to ADDRESS2, just do:

 `curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","amount":2.0}'`
 
  or
      
  `curl http://localhost:PORT/txs -d '{"fromAddress":"ADDRESS1","toAddress":"ADDRESS2","amount":-2.0}'`
  
To check the balance of ADDRESS1, just do:

  `curl http://localhost:PORT/state`
  
  Which returns a JSON dictionary, and then use the key 'balances' and then key 'ADDRESS1' to get the balance for ADDRESS1
 
### Setup & Deployment Notes

To start a Cosmic Bridge node, run the following command:

<pre>
npm install && npm start
</pre>

*bcoin* is required on every validator node in order to test transactions for correctness and submit transactions to the bitcoin network. Indexing of transactions and addresses is required in order to support the queries done by the validator nodes. Set your `/.bcoin/bcoin.conf` file with new values like the following (for testnet):
<p></p>
`bcoin.conf`
<pre>
  network: testnet
  prefix: ~/.bcoin
  api-key: hunter2
  prune: false
  index-tx: true
  index-address: true
</pre>

or use the following command:

<pre>
bcoin --http-host=0.0.0.0 --api-key hunter2 --network=testnet --daemon --index-tx --index-address
</pre>

removing the network flag with testnet for production deployments.

Configuration files are loaded from the `/config` sub-directory. The file `default.json` contains development configuration values, while `production.json` contains production configuration values.

Running tests:
<pre>
  npm test
</pre>

<b>Powered by the Lotion dapp framework:</b><br/>

<p align="center">
  <img src="./img/lotion.png" width="300"/>
</p>

### Useful Links

* https://lotionjs.com/
* http://bcoin.io/guides/multisig-tx.html
* http://bitcoinfaucet.uo1.net/send.php
* https://github.com/bitpay/bitcore-message

