
'use strict';

// Cosmic Bridge HTTP API

// Handles calls from the Cosmic Bridge wallet and potentially, other clients

// TODO understand if our HTTP API needs to handle blockchain operations, or simply be able to tell the clients what bitcoin address to send funds to
// If we'll need to (depends on Judd's design decision basically, implement the below by calling Lotion via the localhost API

const http = require('http')
const express = require('express'); // HTTP Framework
const helper = require('./helper');
const lotionApp = require('./lotion_app');

const app = express();

// Returns the Bitcoin wallet address associated with this Payment Zone
// There is only one such address, and that's the one Bitcoin payments should be sent to 
app.get('/pz-wallet-address', function(req, res) {
  res.send(helper.MASTER_ADDRESS);
});

// Check balance for a bitcoin address this payment zone 
app.get('/balance/:address', function(req, res) {
  const address = req.params.address;
  console.log(`Requested to check the balance of ${address}.`);

  // TODO: IF NEEDED (SEE ABOVE) Check the current balance of that address in the Cosmos and return it
  // Will need access to the lotion app state to do this.
  (async () => {
    // TODO: handle error case.
    const state = lotionApp.getState();
    const balance = helper.getBalance(state, address);
    const response = {'address': address, 'balance': balance};
    res.json(response);
  });
});

// Perform a payment in the payment zone (aka in the Cosmos chain)
// To call via curl, use curl -d to make the call a POST call. E.g.:
// curl -d '' localhost:8080/pay/FROM/TO/504
app.post('/pay/:fromAddress/:toAddress/:amount', function(req, res) {
  const from = req.params.fromAddress;
  const to = req.params.toAddress;
  const amount = req.params.amount;
  const amountBTC = amount * helper.BTC_PER_SATOSHI;
  const body = req.body;
  // TODO: fetch private vars from body.

  console.log(`Payment order received for an amount of ${amountBTC} BTC from ${from} to ${to}.`);

  // TODO IF NEEDED (SEE ABOVE) Validate proof of ownership of the address on behalf of the sender - should be in the payload. Also must be sent over HTTPS
  // TODO Perform the actual payment in the Cosmos chain
  (async () => {
    // TODO: handle error case.
    const state = lotionApp.getState();
    const didTransact = helper.microTransact(state, from, to, amountBTC);
    if (didTransact) {
      const response = {'from': from, 'to': to, 'amount': amountBTC};
      res.json(response);
    }
  });
});

function startHttpServer(port) {
  console.log(`Cosmic Bridge HTTP API server listening on port ${port}`);
  app.listen(port);
}

module.exports = { startHttpServer };
