'use strict';
/*
 * Script to create a mulhttp://bcoin.io/guides/multisig-tx.htmltisig address for use with the cosmosbridge application.
 * 2-of-2: Smart contracts building block such as tumblebit, coinswap and Lightning Network.
 */

const fs = require('fs');
const bcoin = require('bcoin');
const KeyRing = bcoin.wallet.WalletKey;
const Script = bcoin.Script;

const network = 'regtest';

const compressed = true;
const ring1 = KeyRing.generate(compressed, network);
const ring2 = KeyRing.generate(compressed, network);

fs.writeFileSync(`${network}-key1.wif`, ring1.toSecret(network));
fs.writeFileSync(`${network}-key2.wif`, ring2.toSecret(network));

const m = 2;
const n = 2;
const pubKeys = [ring1.publicKey, ring2.publicKey];

const multiSigScript = Script.fromMultisig(m, n, pubKeys);

const base58addr = multiSigScript.getAddress().toBase58(network);

fs.writeFileSync(`${network}-address`, base58addr);
console.log(`Address: ${base58addr}`);
