const library = (function () {
    const config = require('config'); 

    const BTC_PER_SATOSHI = 0.00000001;
    const TX_RATE = 1000;

    const fs = require('fs');
    const assert = require('assert');

    const bclient = require('bclient');
    const WalletClient = bclient.WalletClient;
    const NodeClient = bclient.NodeClient;

    const bcoin = require('bcoin');

    // Itamar - seems like the way to set it, even though it's not what the docs show
    const bitcoinNetwork = bcoin.Network.get(config.bitcoinNetwork);
    const client = new NodeClient({
        network: bitcoinNetwork.type,
        port: bitcoinNetwork.rpcPort,
        apiKey: config.apiKey
    });

    function getInitialMasterWalletAddress() {
      // TODO future - return proper multisig managed address. Further down the road, that address can change during the lifetime of the system as the validator set changes
      return config.masterAddress;
    }

    console.log('Using Master:', getInitialMasterWalletAddress());

    /*
     * Use BTC balance from the master account to credit owed BTC amount to the receiver.
     * amount: Amount in BTC provided as string, e.g. '100'
     * receiverAddress: address of receiver"moTyiK7aExe2v3hFJ9BCsYooTziX15PGuA" or 'RF1PJ1VkHG6H9dwoE2k19a5aigWcWr6Lsu';
     * previousTxHash: Hash of the previously credited BTC to the master address to be used in this transaction.
     * rate for transaction (ex: 1000). // TODO: use dynamic rate evaluation.
     * 
     */
    async function creditBitcoinToReceiver(amount, receiverAddress) {
        const wallet1 = new WalletClient({ id: 'cosigner1', network });
        const wallet2 = new WalletClient({ id: 'cosigner2', network });

        // Transaction options.
        const outputs = [{ address: receiverAddress, value: Amount.fromBTC(amount).toValue() }];
        const options = {
            outputs: outputs
        };

        // This will automatically find coins and fund the transaction (Sign it),
        // also create changeAddress and calculate fee.
        const tx1 = await wallet1.createTX('primary', options);

        // Now you can share this raw output.
        const raw = tx1.hex;

        // Wallet2 will also sign the transaction.
        const tx2 = await wallet2.sign('primary', raw);

        // Now we can broadcast this transaction to the network
        const broadcast = await client.broadcast(tx2.hex);
        console.log(broadcast);
        return broadcast;
    }

    /*
     Perform a microtransaction from wallet of UIDPAYER to wallet of
     UIDRECEIVER for the amount of bitcoin VAL. Return true if successful
     */
    function microTransact(state, uidPayer, uidReceiver, amount) {
        absVal = Math.abs(amount)
        if (hasSufficientBalance(state, uidPayer, absVal)) {
            addBalance(state, uidPayer, -1 * absVal)
            addBalance(state, uidReceiver, absVal)
            return true
        }
        return false
    }

    async function getBitcoinTransaction(txhash) {
        const result = await client.getTX(txhash);
        return result;
    }

    async function getFirstDepositTxIdForAddress(depositorAddress, masterAddress) {
      const txByAddressArr = await client.getTXByAddress(depositorAddress);
      // bcoin returns the transactions in no particular order - at least so it seems
      const sortedTxByAddressArr = txByAddressArr.sort((a, b) => a.time - b.time);
      const firstDepositTx = sortedTxByAddressArr.find(tx =>
        (tx.inputs.find(inputEntry => inputEntry.coin.address === depositorAddress) !== undefined) &&
        (tx.outputs.find(outputEntry => outputEntry.address === masterAddress) !== undefined));
      return firstDepositTx ? firstDepositTx.hash : undefined;
    }

    function processDepositTransaction(tx, masterAddress) {
        const from = tx['inputs']['coin']['address'];
        const depositId = tx['hash'];

        const amount = 0;
        const outputs = tx['outputs']
        outputs.map((output) => {
            if (output.address === masterAddress) {
                amount = output.value;
            }
        });

        const transaction = {
            "from": from,
            "depositId": depositId,
            "amount": amount
        };

        return transaction;
    }

    /*
     Checks the balance to make sure that the wallet of UID has at least
     VAL bitcoin
     */
    function hasSufficientBalance(state, uid, amount) {
        return (state.balances.hasOwnProperty(uid) && state.balances[uid] >= Math.abs(amount));
    }

    function getBalance(state, uid) {
        if (state.balances.hasOwnProperty(uid)) {
            return state.balances[uid];
        }
        return 0;
    }

    /*
     If UID does not exist, adds it to the wallet. Otherwise, adds VAL to the balance of UID
     If VAL is negative and UID does not yet exist, credit 0 balance
     */
    function addBalance(state, uid, amount) {
        if (!state.balances.hasOwnProperty(uid)) {
            state.balances[uid] = 0;
        } 
        state.balances[uid] = Math.max(state.balances[uid] + amount, 0);
        return {'address': uid, 'balance': state.balances[uid], 'added': amount};
    }

    /*
     * addBalance and register the txId as redeemed in the lotion app state.
     */
    function deposit(state, uid, amount, txId) {
        if (!state.deposits.hasOwnProperty(uid)) {
            state.deposits[uid] = [];
        }

        if (state.deposits[uid].indexOf(txId) > -1) {
            console.log(`txId ${txId} has already been credited`);
            return;
        }

        state.deposits[uid] = state.deposits[uid].concat([txId]);
        addBalance(state, uid, amount);
    }

    /*
     Performs a transaction on the bitcoin blockchain to payout to UID for
     VAL
     */
    async function payout(state, uid, amount) {
        if (hasSufficientBalance(state, uid, amount)) {
            const tx = await payoutBitcoinBalance(state, uid, amount)
            return tx;
        } else {
            console.error("Not enough funds in address", uid, amount);
            return 'Not enough funds in address ' + uid;
        }
    }

    async function payoutBitcoinBalance(state, uid, amount) {
        const amountBTC = amount * BTC_PER_SATOSHI;
        const tx = await creditBitcoinToReceiver(amountBTC, uid, 500);
        // Update the state if the TX was successful.
        if (tx) {
            state.balances[uid] = state.balances[uid] - amount;
        } else {
            console.error(`tx was null, could not credit ${amount} satoshi to ${uid}`);
        }
        return tx;
    }

    return {
        payout,
        addBalance,
        deposit,
        processDepositTransaction,
        getBalance,
        hasSufficientBalance,
        microTransact,
        getBitcoinTransaction,
        getFirstDepositTxIdForAddress,
        getInitialMasterWalletAddress,
        BTC_PER_SATOSHI
    };

})();
module.exports = library;
