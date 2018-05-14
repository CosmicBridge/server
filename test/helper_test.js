const assert = require('assert');
const helper = require('../src/helper');
const test = require('tape-promise/tape');

let state;

function reset() {
    state = {};
    state.balances = {};
}

test('hasSufficientBalanceFalse', t => {
    reset()
    state.balances['X'] = 100;
    assert.ok(!helper.hasSufficientBalance(state, 'X', 1000));
    t.end()

});

test('hasSufficientBalanceTrue', t => {
    reset()
    state.balances['X'] = 100;
    assert.ok(helper.hasSufficientBalance(state, 'X', 100));
    t.end()

});

test('addBalanceWithNegative', t => {
    reset()
    state.balances['X'] = 100;
    helper.addBalance(state, 'X', -100);
    assert.equal(state.balances['X'], 0);
    t.end()

});

test('addBalanceWithPositive', t => {
    reset()
    state.balances['X'] = 100;
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 200);
    t.end()

});

test('addBalanceInitial', t => {
    reset()
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 100);
    t.end()

});

test('payoutInsufficientFunds', t => {
    reset()
    state.balances['X'] = 100;
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 200);
    t.end()

});

test('payoutSufficientFunds', t => {
    reset()
    state.balances['X'] = 100;
    helper.payout(state, 'X', 100);
    assert.equal(state.balances['X'], 200);
    t.end()

});


// TODO: Add other tests for helper.js helper library.

