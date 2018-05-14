const assert = require('assert');
const helper = require('../src/helper');
const test = require('tape-promise/tape');

// TODO: Add tests for helper.js helper library.

let state;

test('setup', async t => {
    state = {};
    state.balances = {};
    state.lastZero = {};
});

test('hasSufficientBalanceFalse', t => {
    state.balances['X'] = 100;
    assert.ok(!helper.hasSufficientBalance(state, 'X', 1000));
    t.end()
});

test('hasSufficientBalanceTrue', t => {
    state.balances['X'] = 100;
    assert.ok(helper.hasSufficientBalance(state, 'X', 100));
    t.end()
});
