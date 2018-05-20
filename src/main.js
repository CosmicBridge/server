
const lotionApp = require('./lotion_app');
const httpApi = require('./http_api');
const config = require('config'); // Config file utility (see https://github.com/lorenwest/node-config)

const EXTERNAL_API_PORT = config.get('externalApiPort');
const LOTION_PORT = process.env.COSMIC_BRIDGE_PORT || config.get('lotionPort');

lotionApp.startBlockchainNode(LOTION_PORT);
httpApi.startHttpServer(EXTERNAL_API_PORT);
