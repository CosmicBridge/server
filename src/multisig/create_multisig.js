'use strict';
/*
 * Script to create a multisig address for use with the cosmosbridge application.
 * 2-of-2: Smart contracts building block such as tumblebit, coinswap and Lightning Network.
 * http://bcoin.io/guides/multisig-tx.html
 */
'use strict';

const fs = require('fs');
const bcoin = require('bcoin');
const KeyRing = bcoin.wallet.WalletKey;
const Script = bcoin.script;

const network = 'regtest';
// use compressed pubkeys
const compressed = true;

// Generate two private keys
const ring1 = KeyRing.generate(compressed, network);
const ring2 = KeyRing.generate(compressed, network);

// Export to wif for reimport later.
fs.writeFileSync(`${network}-key1.wif`, ring1.toSecret(network));
fs.writeFileSync(`${network}-key2.wif`, ring2.toSecret(network));

// Create 2-of-2 address.
const m = 2;
const n = 2;
const pubKeys = [ring1.publicKey, ring2.publicKey];

// Assemble multisig script from pubkeys and m-of-n.
const multiSigScript = Script.fromMultisig(m, n, pubKeys);
// Generate P2SH address.
const base58addr = multiSigScript.getAddress().toBase58(network);

// Store address
fs.writeFileSync(`${network}-master-address.txt`, base58addr);
// Multisig address
console.log(`Address: ${base58addr}`);