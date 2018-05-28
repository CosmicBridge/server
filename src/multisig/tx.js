const {NodeClient} = require('bclient');
const bcoin = require('bcoin');
const fs = require('fs');
const Network = bcoin.network;
const network = Network.get('testnet');

const clientOptions = {
  network: network.type,
  port: network.rpcPort,
  apiKey: 'hunter2'
}

const client = new NodeClient(clientOptions);
const address = String(fs.readFileSync('./testnet-master-address.txt'));
console.log('address', address);

(async () => {
  const result = await client.getTXByAddress(address);
  console.log(result);
})().catch((err) => {
  console.error(err.stack);
});