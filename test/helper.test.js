const config = require('config'); 
const assert = require('assert');

function mockFunctions() {
    const original = require.requireActual('../src/helper');
    return {
      ...original, //Pass down all the exported objects
      creditBitcoinToReceiver: jest.fn(() => {console.log('creditBitcoinToReceiver mock method called')}),
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

// bcoin tests: Test with well-known data from the blockchain. After all, it's immutable.
// In order for these to run, bcoin should be run with full indexes of addresses and transactions. 
// Example: npx bcoin --network testnet --index-tx --index-address

it('getFirstDepositTxIdForAddress', async () => {

  let dst, src, txId;

  if (config.bitcoinNetwork === "testnet") {
    // These values are not incorrect, but there are two transactions in the same block that answer the condition - 
    // making the test ambiguous
    //src ='mkKFGGWgp1XpdbcotiMaLfw9eH2jrR9A81';
    //dst = 'n1fwP3HXDN4arrPiJEbtHTpXW6sLPk7hdM';
    //txId = '59d1339c45d3d7525ba27aa9db2a6b4d3a5a15436ff3a893e782a7dae9662b36';
    // the other txId: e2021d40420813c0dc6511f3ae07e46f67f181ae4cbc55b2a9f12eee072ac18b

    src ='mkAtDqY8hQSgTPGHxQ7qgdkCwQwopppoxG';
    dst = '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc';
    txId = '6b0aeb1b1ff0a9d3df55d8a20abfa9c09f284aff6c66932c9d5abd94e4f081d3';
  }
  else {
    src = '33n35mhr1gcGDx1WjWgVnMTDK9NfBfZj8G';
    dst = '354sqxyASbiwRWpT69DSBRPcygk5aMQqWN';
    txId = 'd0c4cb3f54ee014aad1643909a7da8e29e4badb8667f87037725332a30d48692';
  }

  const returnedTxId = await helper.getFirstDepositTxIdForAddress(src, dst);
  
  assert.equal(returnedTxId, txId);
});

it('getBitcoinTransaction', async () => {
  let txId;
  let fee;

  if (config.bitcoinNetwork === "testnet") {
    txId = '69bd7a3ecb0b5fedbe91cf38249b93e5ba548533217f5e0d2f8815b6b9fd6ce2';
    fee = 5200;
  }
  else {
    txId = 'e7c67b01c0f0ff92785fa47405cbdd5fd8a818291a965cc972e37575a25704b6';
    fee = 90000;
  }

  const tx = await helper.getBitcoinTransaction(txId);

  expect(tx).toBeDefined();
  expect(tx.hash).toEqual(txId);
  expect(tx.fee).toEqual(fee);

});

