const assert = require('assert');
const helper = require('../src/helper');
const test = require('tape-promise/tape');

let state;

function reset() {
    state = {};
    state.wallet = {};
    state.balances = {};
    state.networkfee = .001;
}

test('hasSufficientBalanceFalse', t => {
    reset()
    state.balances['X'] = 100;
    assert.ok(!helper.hasSufficientBalance(state, 'X', 100.01));
    t.end()

});

test('hasSufficientBalanceTrue', t => {
    reset()
    state.balances['X'] = 100;
    assert.ok(helper.hasSufficientBalance(state, 'X', 100));
    t.end()

});

test('addBalanceWithNegativeStarting0', t => {
    reset()
    state.balances['X'] = 0;
    helper.addBalance(state, 'X', -100);
    assert.equal(state.balances['X'], 0);
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

test('addMultipleBalancesWithPositive', t => {
    reset()
    state.balances['X'] = 100;
    state.balances['Y'] = 200;
    state.balances['Z'] = 300;
    helper.addBalance(state, 'X', 100);
    helper.addBalance(state, 'Y', 200);
    helper.addBalance(state, 'Z', 300);
    assert.equal(state.balances['X'], 200);
    assert.equal(state.balances['Y'], 400);
    assert.equal(state.balances['Z'], 600);
    t.end()

});

test('addBalanceInitial', t => {
    reset()
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 100);
    t.end()
});

test('addMultipleBalancesInitial', t => {
    reset()
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 100);
    helper.addBalance(state, 'Y', 200);
    assert.equal(state.balances['Y'], 200);
    helper.addBalance(state, 'Z', 300);
    assert.equal(state.balances['Z'], 300);
    t.end()
});

test('payoutInsufficientFundsSmall', t => {
    reset()
    state.balances['X'] = 100;
    assert.throws( function() {helper.payout(state, 'X', 100.001); })
    assert.equal(state.balances['X', 100]);
    t.end()

});

test('payoutInsufficientFundsLarge', t => {
    reset()
    state.balances['X'] = 100;
    assert.throws( function() {helper.payout(state, 'X', 1000.001); })
    assert.equal(state.balances['X', 100]);
    t.end()

});


test('payoutSufficientFunds', t => {
    reset()
    state.balances['X'] = 100;
    helper.payout(state, 'X', 100);
    assert.equal(state.balances['X'], 0);
    t.end()

});

test('microtransactTrue', t => {
    reset()
    state.balances['X'] = 100;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', 100)
    assert.equal(state.balances['Y'], 200);
    assert.equal(state.balances['X'], 0);
    t.end()

});

test('microtransactFalse', t => {
    reset()
    state.balances['X'] = 0;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', 100)
    assert.equal(state.balances['Y'], 100);
    assert.equal(state.balances['X'], 0);
    t.end()

});

test('microtransactNegTrue', t => {
    reset()
    state.balances['X'] = 100;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', -100)
    assert.equal(state.balances['Y'], 200);
    assert.equal(state.balances['X'], 0);
    t.end()

});

test('microtransactNegFalse', t => {
    reset()
    state.balances['X'] = 0;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', -100)
    assert.equal(state.balances['Y'], 100);
    assert.equal(state.balances['X'], 0);
    t.end()

});

// TODO: Add other tests for helper.js helper library.

