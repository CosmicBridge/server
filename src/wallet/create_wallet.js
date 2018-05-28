let id, passphrase, name, type, witness, watchOnly, accountKey;
id = 'newWallet'
passphrase = 'secret456'
witness = false
watchOnly = true
accountKey = 'rpubKBAoFrCN1HzSEDye7jcQaycA8L7MjFGmJD1uuvUZ21d9srAmAxmB7o1tCZRyXmTRuy5ZDQDV6uxtcxfHAadNFtdK7J6RV9QTcHTCEoY5FtQD'

const bclient = require('bclient');
const WalletClient = bclient.WalletClient;
const bcoin = require('bcoin');
const Network = bcoin.network;
const network = Network.get('testnet');

const walletOptions = {
    network: network.type,
    port: 18332,
    apiKey: 'hunter2'
}

let walletClient = new WalletClient(walletOptions);

let options = {
    passphrase: passphrase,
    witness: witness,
    watchOnly: watchOnly,
    accountKey: accountKey
};

(async () => {
    let result = await walletClient.createWallet(id, options);
    console.log(result);
    id = 'primary'
    passphrase = 'secret123'
    name = 'menace'
    type = 'multisig'

    // (8332 for main, 18332 for testnet, 48332 for regtest, and 18556 default for simnet)
    const walletOptions = {
        network: network.type,
        port: 18332,
        apiKey: 'hunter2'
    }

    walletClient = new WalletClient(walletOptions);
    const wallet = walletClient.wallet(id);
    options = { name: name, type: type, passphrase: passphrase };

    result = await wallet.createAccount(name, options);
    console.log(result);
})();