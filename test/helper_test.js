const assert = require('assert');
const helper = require('../src/helper');
const test = require('tape-promise/tape');

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

test('deltaBalanceWithNegative', t => {
    state.balances['X'] = 100;
    helper.deltaBalance(state, 'X', -100);
    assert.equal(state.balances['X'], 0);
    t.end()
});

test('deltaBalanceWithPositive', t => {
    state.balances['X'] = 100;
    assert.ok(helper.deltaBalance(state, 'X', 100));
    assert.equal(state.balances['X'], 200);
    t.end()
});

// TODO: Add other tests for helper.js helper library.

