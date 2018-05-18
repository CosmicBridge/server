const library = (function () {

    const MASTER_ADDRESS = process.env.COSMOS_BRIDGE_MASTER_ADDRESS;
    // const MAIN_NET = 8332;
    // const TEST_NET = 18332;

    // const {WalletClient} = require('bclient');
    // const {Network} = require('bcoin');
    // const network = Network.get('testnet');

    // const walletClient = new WalletClient({
    //     port: network.walletPort,
    //     network: network.type
    // });
    //
    // const id = 'primary'; // or whatever the master wallet name is.
    // const masterWallet = walletClient.wallet(id);

    /*
     * Use BTC balance from the master account to credit owed BTC amount to the receiver.
     * address="moTyiK7aExe2v3hFJ9BCsYooTziX15PGuA"
     * rate for transaction (ex: 500).
     */
    async function creditBitcoinToReceiver(amount, receiverAddress, rate) {
        console.log(`crediting ${amount} BTC to ${receiverAddress}`);
        const options = {
            rate: rate,
            outputs: [{value: amount, address: address}]
        };

        // const tx = await masterWallet.send(options);
        const tx = null;
        console.log(tx);
        return tx;
    }

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
    // Used to minimize the number of net payments between parties.
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
