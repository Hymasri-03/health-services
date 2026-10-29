const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit Metro workers to prevent OOM on 8GB systems
config.maxWorkers = 2;

module.exports = config;
