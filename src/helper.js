const library = (function () {

    const MASTER_ADDRESS = process.env.COSMOS_BRIDGE_MASTER_ADDRESS;

    const fs = require('fs');
    const assert = require('assert');
    const bcoin = require('bcoin');
    const KeyRing = bcoin.wallet.WalletKey;
    const Script = bcoin.Script;
    const MTX = bcoin.MTX;
    const Amount = bcoin.Amount;
    const Coin = bcoin.Coin;

    const network = 'regtest';


    // grab private keys
    const secret1 = fs.readFileSync('./multisig/regtest-key1.wif').toString();
    const secret2 = fs.readFileSync('./multisig/regtest-key2.wif').toString();

    // generate keyring object (pubkeys too)
    const ring1 = KeyRing.fromSecret(secret1);
    const ring2 = KeyRing.fromSecret(secret2);

    const m = 2;
    const n = 2;
    
    /*
     * Use BTC balance from the master account to credit owed BTC amount to the receiver.
     * amount: Amount in BTC provided as string, e.g. '100'
     * receiverAddress: address of receiver"moTyiK7aExe2v3hFJ9BCsYooTziX15PGuA" or 'RF1PJ1VkHG6H9dwoE2k19a5aigWcWr6Lsu';
     * previousTxHash: Hash of the previously credited BTC to the master address to be used in this transaction.
     * rate for transaction (ex: 500). // TODO: use dynamic rate evaluation.
     * 
     */
    async function creditBitcoinToReceiver(amount, receiverAddress, rate, previousTxHash) {
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
        console.log(spend2.toRaw().toString('hex'));
    }

    // groupPayments: Minimize the number of net payments between parties by taking a list of transactions
    // and merging them such that the net number of transactions to achieve the final transaction state is minimized.
    // @param payments list of {amount: ..., receiverAddress: ..., senderAddress: ...}
    // @return paymentMap map of the form:
    // {
    //     receiver1: {
    //          sender1: X1 BTC,
    //          ...
    //          senderN: Xn BTC
    //      },
    //      ...
    // }
    function groupPayments(payments) {
        const paymentMap = {};
        payments.map((payment) => {
            const amount = payment.amount;
            const receiverAddress = payment.receiverAddress;
            const senderAddress = payment.senderAddress;
            console.log('payment', payment);
            if (paymentMap.hasOwnProperty(receiverAddress)) {
                if (!paymentMap[receiverAddress].hasOwnProperty(senderAddress)) {
                    paymentMap[receiverAddress][senderAddress] = 0;
                }
                paymentMap[receiverAddress][senderAddress] += amount
            } else if (paymentMap.hasOwnProperty(senderAddress)) {
                // If the sender is already in the map.
                if (!paymentMap[senderAddress].hasOwnProperty(receiverAddress)) {
                    paymentMap[senderAddress][receiverAddress] = 0;
                }
                paymentMap[senderAddress][receiverAddress] -= amount;
            } else {
                // key not present
                paymentMap[receiverAddress] = {};
                paymentMap[receiverAddress][senderAddress] = amount;
            }
        });

        return paymentMap
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
        return (state.balances[uid] && state.balances[uid] >= Math.abs(val));
    }

    /*
     If UID does not exist, adds it to the wallet. Otherwise, adds VAL to the balance of UID
     If VAL is negative and UID does not yet exist, credit 0 balance
     */
    function addBalance(state, uid, val) {
        if (state.balances[uid]) {
            state.balances[uid] = state.balances[uid] + val
        } else {
            if (val < 0) {
                state.balances[uid] = 0
            } else {
                state.balances[uid] = val
            }
        }
    }

    /*
     Performs a transaction on the bitcoin blockchain to payout to UID for
     VAL
     */
    function payout(state, uid, val) {
        if (hasSufficientBalance(state, uid, val)) {
            addBalance(state, uid, -1*val)
        } else {
            //console.error("Not enough funds", JSON.stringify(state), uid, val);
            throw 'Not enough funds';
        }
    }

    async function payoutBalance(uid, state) {
        const balance = state.balance[uid];
        const tx = await helper.creditBitcoinToReceiver(balance, 500);
        // If the balance has been successfully settled using bcoin, clear the owed balance and update the last zero time
        // for the address/uid.
        if (tx) {
            state.lastZero[uid] = new Date().getTime();
            state.balances[uid] = 0;
        }
        return tx;
    }

    return {
        payout: payout,
        payoutBalance: payoutBalance,
        addBalance: addBalance,
        hasSufficientBalance: hasSufficientBalance,
        microTransact: microTransact,
        groupPayments: groupPayments,
        creditBitcoinToReceiver: creditBitcoinToReceiver,
        MASTER_ADDRESS: MASTER_ADDRESS
    };

})();
module.exports = library;
