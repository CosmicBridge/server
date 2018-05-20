
'use strict';

// Cosmic Bridge HTTP API

// Handles calls from the Cosmic Bridge wallet and potentially, other clients

// TODO understand if our HTTP API needs to handle blockchain operations, or simply be able to tell the clients what bitcoin address to send funds to
// If we'll need to (depends on Judd's design decision basically, implement the below by calling Lotion via the localhost API

var http = require('http')
var express = require('express'); // HTTP Framework

var app = express();

// Returns the Bitcoin wallet address associated with this Payment Zone
// There is only one such address, and that's the one Bitcoin payments should be sent to 
app.get('/pz-wallet-address', function(req, res) {
  // TODO 
  res.send("None");
});

// Check balance for a bitcoin address this payment zone 
app.get('/balance/:address', function(req, res) {

  console.log(`Requsted to check the balance of ${req.params.address}.`);

  // TODO IF NEEDED (SEE ABOVE) Check the current balance of that address in the Cosmos and return it

  res.send("0");
});

// Perform a payment in the payment zone (aka in the Cosmos chain)
// To call via curl, use curl -d to make the call a POST call. E.g.:
// curl -d '' localhost:8080/pay/FROM/TO/504
app.post('/pay/:fromAddress/:toAddress/:howMuch', function(req, res) {

  console.log(`Payment order received for an amount of ${req.howMuch} satoshis from ${req.params.fromAddress} to ${req.params.toAddress}.`);

  // TODO IF NEEDED (SEE ABOVE) Validate proof of ownership of the address on behalf of the sender - should be in the payload. Also must be sent over HTTPS

  // TODO Perform the actual payment in the Cosmos chain
  

  res.send('Okay');
});

function startHttpServer(port) {
  console.log(`Cosmic Bridge HTTP API server listening on port ${port}`);
  app.listen(port);
}

module.exports = { startHttpServer };
