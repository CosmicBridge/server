const axios = require('axios');
const lotion = require('lotion');
const coins = require('coins');
const schedule = require('node-schedule');

const bridge = require('./bridge');

const BASE_URL = process.env.COSMOS_BRIDGE_URL || 'http://localhost';
const PORT = process.env.COSMOS_BRIDGE_PORT || 3000;


// Configurable recurrence rule for running payout job.
// Currently set for every Sunday at 5:00pm.
const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0];
rule.hour = 17;
rule.minute = 0;

let payoutJob;

const app = lotion({
    // lotion options
    initialState: {
        // Accounts keeps track of credited balances for users based on BTC they have sent to the master address.
        accounts: {}, // map of bridgeAddress: {bitcoinAddress: ..., credit: ...}
        // These are the payments that will be settled (cleared) at the end of the next payment period.
        payments: [] // list of {amount: ..., receiverAddress: ..., senderAddress: ...}
    },
    devMode: true
});

app.use(coins({
    // coins options.
    name: 'cosmosbridge',
}));

function getState() {
    return axios.get(`${BASE_URL}:${PORT}/state`).then(res => res.data)
}

// settle/combine payments for minimal net BTC transactions from the lotion app state.
function payoutTask() {
    console.log('running payoutTask');
    getState().then((state) => {
        console.log('current state', state);
        const paymentMap = bridge.groupPayments(state.payments);
        const receivers = Object.keys(paymentMap);
        receivers.map((receiverAddress) => {
            // Distribute best-aggregated credits to users.
            // TODO: Once credit successful, remove from payments app state.
            bridge.creditBitcoinToReceiver(paymentMap[receiverAddress], receiverAddress);
        });
    });
}

app.listen(PORT).then(({GCI}) => {
    console.log('CosmosBridge app running on port:', PORT);
    // App identifier.
    console.log('GCI:', GCI);
    payoutJob = schedule.scheduleJob(rule, payoutTask);
});