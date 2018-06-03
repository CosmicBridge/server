'use strict';

const assert = require('assert');
const bcoin = require('bcoin');
const bclient = require('bclient');
const NodeClient = bclient.NodeClient;
const WalletClient = bclient.WalletClient

const Network = bcoin.network;
const testnet = Network.get('testnet');
testnet['api-key'] = 'hunter2';

const network = testnet.type;

const m = 2;
const n = 2;

const client = new NodeClient(network);
// const client = new WalletClient( {network} )

// Wrapper for skipping errors, when you rerun the script
// It could have been as simple as
//  await client.createWallet('primary', options);
const createMultisigWallet = async function createMultisigWallet(client, options, skipExists) {
  assert(client instanceof NodeClient, 'client should be NodeClient');
  assert(options.id, 'You need to provide id in options');

  const defaultOpts = {
    type: 'multisig',
    m: m,
    n: n
  };

  Object.assign(defaultOpts, options);

  let res;
  try {
    res = await client.createWallet('primary', defaultOpts);
  } catch (e) {
    if (skipExists && e.message === 'WDB: Wallet already exists.') {
      return null;
    }

    throw e;
  }

  return res;
};

// Wrapper for skipping errors, when you rerun the script
// It could have been as simple as
//  await client.addSharedKey(account, xpubkey);
const addSharedKey = async function addSharedKey(client, account, xpubkey, skipRemoveError) {
  assert(client instanceof WalletClient, 'client should be WalletClient');
  assert(account, 'should provide account');
  assert(xpubkey, 'should provide xpubkey');

  let res;

  try {
    res = await client.addSharedKey('primary', account, xpubkey);
  } catch (e) {
    if (e.message === 'Cannot remove key.') {
      return null;
    }

    throw e;
  }

  return res;
};

(async () => {
  // Let's create wallets if they don't exist
  await createMultisigWallet(client, { id: 'cosigner1' }, true);
  await createMultisigWallet(client, { id: 'cosigner2' }, true);

  // Initialize wallet http clients
  // They will be talking to Node's API
  const wallet1 = new WalletClient({ id: 'cosigner1', network });
  const wallet2 = new WalletClient({ id: 'cosigner2', network });

  // This isn't strictly necessary, but you can either create new
  // accounts under wallets and use them
  const wallet1account = 'default';
  const wallet2account = 'default';

  // Both wallets need to exchange XPUBKEYs to each other
  // in order to generate receiving and change addresses.
  // Let's take it from the default account.
  const wallet1info = await wallet1.getInfo('primary');
  const wallet2info = await wallet2.getInfo('primary');

  // Grab the xpubkey from wallet, we need to share them
  const wallet1xpubkey = wallet1info.account.accountKey;
  const wallet2xpubkey = wallet2info.account.accountKey;

  // Here we share xpubkeys to each other
  await addSharedKey(wallet1, wallet1account, wallet2xpubkey);
  await addSharedKey(wallet2, wallet2account, wallet1xpubkey);

  // Now we can get address from both wallets
  // NOTE: that both wallets should be on the same index
  // (depth) of derivation to geth the same addresses
  // NOTE: Each time you createAddress index(depth) is
  // incremented an new address is generated
  const address1 = await wallet1.createAddress('primary', wallet1account);
  const address2 = await wallet2.createAddress('primary', wallet2account);

  // Address for both shouuld be the same
  // Unless they were run separately. (Or by manually triggering API)
  console.log(address1);
  console.log(address2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});