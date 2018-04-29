const library = (function () {
    // TODO: import bcoin.

    const MASTER_ADDRESS = process.env.COSMOS_BRIDGE_MASTER_ADDRESS;

    /*
     * Use BTC balance from the master account to credit owed BTC amount to the receiver.
     */
    async function creditBitcoinToReceiver(amount, receiverAddress) {
        // TODO: send amount from master account to receiver using bcoin.
        console.log(`crediting ${amount} BTC to ${receiverAddress}`);
    }

    // @param payments list of {amount: ..., receiverAddress: ..., senderAddress: ...}
    // @return paymentMap map of the form:
    // {
    //     receiver1: X BTC,
    //     ...
    //     receiverN: Y BTC
    // }
    function groupPayments(payments) {
        const paymentMap = {};
        payments.map((payment) => {
            console.log('payment', payment);
            if (!paymentMap.hasOwnProperty(payment.receiverAddress)) {
                paymentMap[payment.receiverAddress] = 0;
            }
            paymentMap[payment.receiverAddress] += amount;
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
