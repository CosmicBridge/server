const library = (function () {
    const config = require('config'); 

    const MASTER_ADDRESS = config.masterAddress;
    console.log('Using Master:', MASTER_ADDRESS);

    const BTC_PER_SATOSHI = 0.00000001;

    const fs = require('fs');
    const assert = require('assert');
    const bcoin = require('bcoin');
    const KeyRing = bcoin.wallet.WalletKey;
    const Script = bcoin.Script;
    const MTX = bcoin.MTX;
    const Amount = bcoin.Amount;
    const Coin = bcoin.Coin;

    const network = 'regtest';
    /*
     * Use BTC balance from the master account to credit owed BTC amount to the receiver.
     * amount: Amount in BTC provided as string, e.g. '100'
     * receiverAddress: address of receiver"moTyiK7aExe2v3hFJ9BCsYooTziX15PGuA" or 'RF1PJ1VkHG6H9dwoE2k19a5aigWcWr6Lsu';
     * previousTxHash: Hash of the previously credited BTC to the master address to be used in this transaction.
     * rate for transaction (ex: 500). // TODO: use dynamic rate evaluation.
     * 
     */
    async function creditBitcoinToReceiver(amount, receiverAddress, rate, previousTxHash) {
        // grab private keys
        const secret1 = fs.readFileSync('./multisig/regtest-key1.wif').toString();
        const secret2 = fs.readFileSync('./multisig/regtest-key2.wif').toString();

        // generate keyring object (pubkeys too)
        const ring1 = KeyRing.fromSecret(secret1);
        const ring2 = KeyRing.fromSecret(secret2);

        const m = 2;
        const n = 2;


        console.log(`crediting ${amount} BTC to ${receiverAddress} at ${rate} rate.`);
        const pubkey1 = ring1.publicKey;
        const pubkey2 = ring2.publicKey;

        // the redeem
        const redeem = Script.fromMultisig(m, n, [pubkey1, pubkey2]);
        // p2sh script
        const script = Script.fromScripthash(redeem.hash160());
        // Send change from transaction back to master address.
        const changeAddr = script.getAddress().toBase58(network);

        // Previous tx info 
        const sendTo = receiverAddress; 
        const txInfo = {
            value: Amount.fromBTC(amount).toValue(),
            // Previous transaction hash.
            hash: previousTxHash,
            index: 0
        };

        // Coin provides information for the transaction that is aggregated in CoinView within the mtx.
        // Contains information about the previous output.
        const coin = Coin.fromJSON({
            version: 1,
            height: -1,
            value: txInfo.value,
            coinbase: false,

            script: script.toJSON(),
            hash: txInfo.hash,
            index: txInfo.index
        });

        // Now we create mutable transaction object
        const spend1 = new MTX();
        ring1.script = redeem;

        // send
        spend1.addOutput({
            address: sendTo,
            value: Amount.fromBTC(amount).toValue()
        });

        // this will automatically select coins and
        // send change back to our address
        await spend1.fund([coin], {
            rate: rate,
            changeAddress: changeAddr
        });

        spend1.scriptInput(0, coin, ring1);
        spend1.signInput(0, coin, ring1);
        const raw = spend1.toRaw();

        const spend2 = MTX.fromRaw(raw);
        spend2.script = redeem;
        spend2.view.addCoin(coin);
        spend2.signInput(0, coin, ring2);

        // Both users signed, transaction should be complete.
        // Let's make sure that the transaction is valid
        assert(spend2.verify(), 'Transaction isnt valid.');
        tx = spend2.toRaw().toString('hex')
        console.log('tx', tx);
        return tx;
    }

    /*
     Perform a microtransaction from wallet of UIDPAYER to wallet of
     UIDRECEIVER for the amount of bitcoin VAL. Return true if successful
     */
    function microTransact(state, uidPayer, uidReceiver, val) {
        absVal = Math.abs(val)
        if (hasSufficientBalance(state, uidPayer, absVal)) {
            addBalance(state, uidPayer, -1 * absVal)
            addBalance(state, uidReceiver, absVal)
            return true
        }
        return false
    }

    /*
     Checks the balance to make sure that the wallet of UID has at least
     VAL bitcoin
     */
    function hasSufficientBalance(state, uid, val) {
        return (state.balances.hasOwnProperty(uid) && state.balances[uid] >= Math.abs(val));
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
    function addBalance(state, uid, val) {
        if (!state.balances.hasOwnProperty(uid)) {
            state.balances[uid] = 0;
        } 
        state.balances[uid] = Math.max(state.balances[uid] + val, 0);
    }

    /*
     Performs a transaction on the bitcoin blockchain to payout to UID for
     VAL
     */
    async function payout(state, uid, val) {
        if (hasSufficientBalance(state, uid, val)) {
            const tx = await payoutBitcoinBalance(state, uid, val)
            return tx;
        } else {
            //console.error("Not enough funds", JSON.stringify(state), uid, val);
            return 'Not enough funds in address ' + uid;
        }
    }

    async function payoutBitcoinBalance(state, uid, amount, test) {
        const amountBTC = amount * BTC_PER_SATOSHI;
        const tx = await creditBitcoinToReceiver(amountBTC + "", 500);
        if (tx) {
            // Update the state if the TX was successful.
            state.balance[uid] = state.balance[uid] - amount;
        }
        return tx;
    }

    return {
        payout: payout,
        addBalance: addBalance,
        getBalance: getBalance,
        hasSufficientBalance: hasSufficientBalance,
        microTransact: microTransact,
        BTC_PER_SATOSHI: BTC_PER_SATOSHI,
        MASTER_ADDRESS: MASTER_ADDRESS
    };

})();
module.exports = library;
