const assert = require('assert');
const bridge = require('../src/bridge');
const test = require('tape-promise/tape');


test('group payments', t => {
    "use strict";

    const payments = [
        {amount: 1, receiverAddress: 'A', senderAddress: 'C'},
        {amount: 2, receiverAddress: 'B', senderAddress: 'C'},
        {amount: 3, receiverAddress: 'C', senderAddress: 'B'},
    ];
    const res = bridge.groupPayments(payments);
    // Each key is a receiver.
    // Each object (value) indicates that person should pay that amount to the receiver.
    // Negative means receiver -> sender.
    const expected = { 'A': { 'C': 1 }, 'B': { 'C': -1 } };
    assert.deepEqual(expected, res);
    t.end()
});

// TODO: Add more Tests for bridge.js helper library.
