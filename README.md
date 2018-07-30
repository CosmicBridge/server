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

In order to participate in the Cosmic Bridge network, a user should send bitcoin to a particular payment zone address - a specific wallet on the Bitcoin blockchain. Once bitcoin has been received, users can micro-transact bitcoin on a Cosmos chain (this chain is the "payment zone"). The balances can be paid out on-demand on the Bitcoin chain, vastly reducing the number of required transactions (and hence the transaction fees paid) as the number of transactions on the off-chain network increases.

The end result is that users save transaction fees by bundling up transactions on the bitcoin network while still enjoying transparency and safety. In return, the complete trustlessness of the Bitcoin chain is exchanged with a degree of trust in the validator set of the payment zone. This compromise can be acceptable for many potential uses, such as large volumes of micropayments.

### Potential Uses

Cosmic Bridge can be used for any application that requires cheap, fast and auditable settlement of Bitcoin transactions, assuming on-demand Bitcoin-chain settlement is acceptable. Payment Zones can be free for anyone to join, or limited to certain parties. In theory, the longer users maintain and use the balances on the cosmos bridge network, the more optimizations can be done in terms of payment merging. Some potential applications:

* Bitcoin micropayments
* Dark pools of BTC liquidity between exchanges or large traders
* A merchant network supporting free bitcoin payments for participating merchants

### Staking
Right now the system does not involve stake mechanics, since the idea is to rely on a trusted, well-known set of validators. In the future, staking mechanics, based on BTC staking or a native token, could be implemented easily as Cosmos supports them.

### How it works

<b>The network supports three main transaction types once the app is running</b>

Generally, connecting to the payment zone should be done via the Tendermint API. Following are a few examples you can run from the command line.

* User wants to register a particular transaction to the masteraddress as a deposit into the payment zone network.
To deposit a balance of 3 satoshis onto ADDRESS1, just do:

  `curl http://localhost:PORT/txs -d '{"depositId": "XXX", "amount":3.0, "to": "ADDRESS1", "command": "deposit"}'`
  
* User wants to withdraw funds from the payment zone into his/her bitcoin account.
To payout a balance of 3 satoshis onto ADDRESS1, just do:

  `curl http://localhost:PORT/txs -d '{"amount":2.0, "from": "ADDRESS1", "command": "withdraw"}'`

* User wants to send funds from within the payment zone to another address.  
To make a microtransaction of 1 satoshi from ADDRESS1 to ADDRESS2, just do:

 `curl http://localhost:PORT/txs -d '{"amount": 1, "from": "ADDRESS1", "to": "ADDRESS2", "signature": "XXX", "command": "pay"}'`


### Checking the app state (Balances).
To check the balance of ADDRESS1, just do:

`curl http://localhost:PORT/state`
  
Which returns a JSON dictionary, and then use the key 'balances' and then key 'ADDRESS1' to get the balance for ADDRESS1
 
### Setup

<p>Examine the config files first.</p>

If you're creating a new payment zone (or app), you should create a new multisig wallet for the master address. This can be done from the `src/multisig` folder by running the `create_multisig.js` script.

Configuration files are loaded from the `/config` sub-directory. The file `default.json` contains development configuration values, while `production.json` contains production (mainnet) configuration values.

#### Running the Cosmic Bridge app (creating a payment zone).

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

removing the network flag for mainnet deployments. Note that the `index-tx` and `index-address` flags are required by the node in order to perform historic queries on the master address.

### Running tests (jest):

<pre>
  npm test
</pre>

### Notes for production use

For a mainnet app, you'll want to define a set of validators as well as a genesis block so the app doesn't create a new GCI each time the app is run. This is documented further in the initial state of `lotion_app.js`.

### Useful Links

* https://lotionjs.com/
* http://bcoin.io/guides/multisig-tx.html
* http://bitcoinfaucet.uo1.net/send.php
* https://github.com/bitpay/bitcore-message

<b>Powered by the Lotion dapp framework:</b><br/>

<p align="center">
  <img src="./img/lotion.png" width="300"/>
</p>
