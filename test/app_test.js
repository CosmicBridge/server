const axios = require('axios');
const test = require('tape-promise/tape');
const lotion = require('lotion');
const rimraf = require('rimraf');

const BASE_URL = `http://localhost:3000`;

// TODO: Add custom CosmosBridge tests.

function getState() {
    return axios.get(`${BASE_URL}/state`).then(res => res.data)
}

test('setup', async t => {
    // configure lotion app to test against
    const opts = {
        initialState: {txCount: 0, blockCount: 0, specialTxCount: 0},
        devMode: true,
        logTendermint: false
    };

    app = lotion(opts);
    function txHandler(state, tx, chainInfo) {
        if (tx.doNothing) {
            return
        }
        state.txCount++;
        if (tx.shouldError === true) {
            throw new Error('this transaction should cause an error')
        }
        if (tx.isSpecial) {
            state.specialTxCount++
        }
        if (tx.mutateDeep) {
            if (!state.accounts) {
                state.accounts = {};
                state.accounts.foo = {};
                state.accounts.foo.balance = 40
            } else {
                state.accounts.foo.otherBalance = 60
            }
        }
    }

    function blockHandler(state, chainInfo) {
        state.blockCount++;
        state.lastHeight = chainInfo.height - 1
    }

    function txEndpoint(tx, nodeInfo) {
        return Object.assign({}, tx, {isSpecial: true})
    }

    app.use(txHandler)
    app.useBlock(blockHandler)
    app.useTxEndpoint('/special', txEndpoint)

    const {GCI} = await app.listen(3000)
    t.equal(typeof GCI, 'string')

    t.end()
})

test('get initial state', async t => {
    const state = await getState()

    t.equal(state.txCount, 0)
    t.end()
})

test('node info endpoint', async t => {
    const result = await axios.get('http://localhost:3000/info')
    t.equal(result.data.pubKey.length, 64)
    t.end()
})

test('cleanup', t => {
    app.close()
    t.end()
    process.exit()
})
