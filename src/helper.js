const library = (function () {
    const config = require('config'); 

    const MASTER_ADDRESS = config.masterAddress;
    console.log('Using Master:', MASTER_ADDRESS);

    const BTC_PER_SATOSHI = 0.00000001;

    const fs = require('fs');
    const assert = require('assert');

    const bclient = require('bclient');
    const WalletClient = bclient.WalletClient;
    const NodeClient = bclient.NodeClient;

    const bcoin = require('bcoin');
    const KeyRing = bcoin.wallet.WalletKey;
    const Script = bcoin.script;
    const MTX = bcoin.mtx;
    const Amount = bcoin.amount;
    const Coin = bcoin.coin;

    const network = 'testnet';
    /*
     * Use BTC balance from the master account to credit owed BTC amount to the receiver.
     * amount: Amount in BTC provided as string, e.g. '100'
     * receiverAddress: address of receiver"moTyiK7aExe2v3hFJ9BCsYooTziX15PGuA" or 'RF1PJ1VkHG6H9dwoE2k19a5aigWcWr6Lsu';
     * previousTxHash: Hash of the previously credited BTC to the master address to be used in this transaction.
     * rate for transaction (ex: 500). // TODO: use dynamic rate evaluation.
     * 
     */
    async function creditBitcoinToReceiver(amount, receiverAddress, rate, previousTxHash) {
        const client = new NodeClient({ network });
        const wallet1 = new WalletClient({ id: 'cosigner1', network });
        const wallet2 = new WalletClient({ id: 'cosigner2', network });
      
        // Because we can't sign and spend from account
        // We can't use `spend` as we do with normal transactions
        // since it immediately publishes to the network
        // and we need other signatures first.
        // So we first create the transaction
        const outputs = [{ address: sendTo, value: Amount.fromBTC(1).toValue() }];
        const options = {
          // rate: 1000,
          outputs: outputs
        };
      
        // This will automatically find coins and fund the transaction (Sign it),
        // also create changeAddress and calculate fee
        const tx1 = await wallet1.createTX('primary', options);
      
        // Now you can share this raw output
        const raw = tx1.hex;
      
        // Wallet2 will also sign the transaction
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

    async function getTransaction(txId) {
        const result = await client.getTX(txhash);
        console.log(result);
        return result;
    }

    function processDepositTransaction(tx) {
        const from = tx['inputs']['coin']['address'];
        const depositId = tx['hash'];

        const amount = 0;
        const outputs = tx['outputs']
        outputs.map((output) => {
            if (output.address === helper.MASTER_ADDRESS) {
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

    async function payoutBitcoinBalance(state, uid, amount, test) {
        const amountBTC = amount * BTC_PER_SATOSHI;
        const tx = await creditBitcoinToReceiver(amountBTC, 500);
        // Update the state if the TX was successful.
        if (tx) {
            state.balances[uid] = state.balances[uid] - amount;
        } else {
            console.error(`tx was null, could not credit ${amount} satoshi to ${uid}`);
        }
        return tx;
    }

    return {
        payout: payout,
        addBalance: addBalance,
        deposit: deposit,
        processDepositTransaction: processDepositTransaction,
        getBalance: getBalance,
        hasSufficientBalance: hasSufficientBalance,
        microTransact: microTransact,
        BTC_PER_SATOSHI: BTC_PER_SATOSHI,
        MASTER_ADDRESS: MASTER_ADDRESS
    };

})();
module.exports = library;
