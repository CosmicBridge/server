
'use strict';

// Cosmic Bridge HTTP API

// Handles calls from the Cosmic Bridge wallet and potentially, other clients

var http = require('http')
var express = require('express'); // HTTP Framework
var config = require('config'); // Config file utility (see https://github.com/lorenwest/node-config)

var app = express();

const PORT = config.get('httpPort');

// TODO Later on, will be managed by the multi-sig-validators wallet management logic
const BITCOIN_WALLET_ADDRESS = config.get('bitcoinWalletAddress');

// Returns the Bitcoin wallet address associated with this Payment Zone
// There is only one such address, and that's the one Bitcoin payments should be sent to 
app.get('/pz-wallet-address', function(req, res) {
  res.send(BITCOIN_WALLET_ADDRESS);
});

// Check balance for a bitcoin address this payment zone 
app.get('/balance/:address', function(req, res) {

  console.log(`Requsted to check the balance of ${req.params.address}.`);

  // TODO Check the current balance of that address in the Cosmos and return it

  res.send("0");
});

// Perform a payment in the payment zone (aka in the Cosmos chain)
// To call via curl, use curl -d to make the call a POST call. E.g.:
// curl -d '' localhost:8080/pay/FROM/TO/504
app.post('/pay/:fromAddress/:toAddress/:howMuch', function(req, res) {

  console.log(`Payment order received for an amount of ${req.howMuch} satoshis from ${req.params.fromAddress} to ${req.params.toAddress}.`);

  // TODO Validate proof of ownership of the address on behalf of the sender - should be in the payload. Also must be sent over HTTPS

  // TODO Perform the actual payment in the Cosmos chain
  

  res.send('Okay');
});

console.log(`Cosmic Bridge server starting on port ${PORT}`);

app.listen(PORT);
