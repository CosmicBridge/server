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

    return {
        groupPayments: groupPayments,
        creditBitcoinToReceiver: creditBitcoinToReceiver,
        MASTER_ADDRESS: MASTER_ADDRESS
    };

})();
module.exports = library;
