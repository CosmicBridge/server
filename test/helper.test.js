const assert = require('assert');

function mockFunctions() {
    const original = require.requireActual('../src/helper');
    return {
      ...original, //Pass down all the exported objects
      creditBitcoinToReceiver: jest.fn(() => {console.log('I didnt call the original')}),
    }
}
jest.mock('../src/helper', () => mockFunctions());
const helper = require('../src/helper');

let state;

function reset() {
    state = {};
    state.wallet = {};
    state.balances = {};
    state.networkfee = .001;
}

beforeEach(() => {
    reset();
});

it('hasSufficientBalanceFalse', () => {
    
    state.balances['X'] = 100;
    assert.ok(!helper.hasSufficientBalance(state, 'X', 100.01));
});

it('hasSufficientBalanceTrue', () => {
    
    state.balances['X'] = 100;
    assert.ok(helper.hasSufficientBalance(state, 'X', 100));
});

it('addBalanceWithNegativeStarting0', () => {
    
    state.balances['X'] = 0;
    helper.addBalance(state, 'X', -100);
    assert.equal(state.balances['X'], 0);
});

it('addBalanceWithNegative', () => {
    
    state.balances['X'] = 100;
    helper.addBalance(state, 'X', -100);
    assert.equal(state.balances['X'], 0);
});

it('addBalanceWithPositive', () => {
    
    state.balances['X'] = 100;
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 200);
});

it('addMultipleBalancesWithPositive', () => {
    
    state.balances['X'] = 100;
    state.balances['Y'] = 200;
    state.balances['Z'] = 300;
    helper.addBalance(state, 'X', 100);
    helper.addBalance(state, 'Y', 200);
    helper.addBalance(state, 'Z', 300);
    assert.equal(state.balances['X'], 200);
    assert.equal(state.balances['Y'], 400);
    assert.equal(state.balances['Z'], 600);
});

it('addBalanceInitial', () => {
    
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 100);
});

it('addMultipleBalancesInitial', () => {
    
    helper.addBalance(state, 'X', 100);
    assert.equal(state.balances['X'], 100);
    helper.addBalance(state, 'Y', 200);
    assert.equal(state.balances['Y'], 200);
    helper.addBalance(state, 'Z', 300);
    assert.equal(state.balances['Z'], 300);
});

it('microtransactTrue', () => {
    
    state.balances['X'] = 100;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', 100)
    assert.equal(state.balances['Y'], 200);
    assert.equal(state.balances['X'], 0);
});

it('microtransactFalse', () => {
    
    state.balances['X'] = 0;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', 100);
    assert.equal(state.balances['Y'], 100);
    assert.equal(state.balances['X'], 0);
});

it('microtransactNegTrue', () => {
    
    state.balances['X'] = 100;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', -100)
    assert.equal(state.balances['Y'], 200);
    assert.equal(state.balances['X'], 0);
});

it('microtransactNegFalse', () => {
    
    state.balances['X'] = 0;
    state.balances['Y'] = 100;
    helper.microTransact(state, 'X', 'Y', -100)
    assert.equal(state.balances['Y'], 100);
    assert.equal(state.balances['X'], 0);
});

it('getBalance', () => {
    
    state.balances['X'] = 100;
    assert.equal(helper.getBalance(state, 'X'), 100);
});

it('getBalanceNoAccount', () => {
    
    assert.equal(helper.getBalance(state, 'X'), 0);
});

