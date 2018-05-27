
const lotionApp = require('./lotion_app');
const httpApi = require('./http_api');
const config = require('config'); // Config file utility (see https://github.com/lorenwest/node-config)

lotionApp.startBlockchainNode(httpApi);
