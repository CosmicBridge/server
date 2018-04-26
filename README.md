# Cosmic Bridge
Server node for the Cosmic Bridge application. Manages tracking payments/balance on the Cosmos chain and bundled scheduled payouts on the Bitcoin mainnet.


### Concept

The Cosmic Bridge server node both serves as a validator/facilitator of transactions and a repository of funds.

In order to participate in the Cosmic Bridge network, a user should send bitcoin to a particular payment zone address. Once bitcoin has been received, users can batch bitcoin transactions off-chain using Lotion.js which will be paid out at a regular operating frequency.

For example, an operating frequency of one week means the following:

* The server node will accumulate transactions of its participants over the course of the week. 
* These transactions will be posted/validated by the cosmos distributed network, bundled, and paid out at the end of each week interval.
* Users save transaction fees by bundling up transactions on the bitcoin network.


### Setup:

To start a Cosmic Bridge node, run the following command from the `/src` directory:

<pre>
npm install && npm start
</pre>

### Dev Notes


Powered by:<br/>
<img src="./img/lotion.png" style="width: 300px"/>


### Useful Links

* https://lotionjs.com/

