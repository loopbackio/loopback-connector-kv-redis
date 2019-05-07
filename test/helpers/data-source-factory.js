// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-kv-redis
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const DataSource = require('loopback-datasource-juggler').DataSource;
const connector = require('../..');

const SETTINGS = {
  host: process.env.REDIS_HOST || 'localhost',
  port: +process.env.REDIS_PORT || undefined,
  connector: connector,
  // produce nicer stack traces
  showFriendlyErrorStack: true,
};

if (process.env.CI) {
  // Try to avoid collisions when multiple CI jobs are running on the same host
  // by picking a (semi)random database number to use.
  SETTINGS.db = process.pid % 16;
}

function createDataSource(options) {
  const settings = Object.assign({}, SETTINGS, options);

  return new DataSource(settings);
};

module.exports = createDataSource;

let invalidPort = 4; // invalid port where nobody is listening

createDataSource.failing = function(options) {
  const settings = Object.assign({
    host: '127.0.0.1',
    port: invalidPort++,

    // disable auto-reconnect
    retryStrategy: null,
    reconnectOnError: null,
  }, options);

  return createDataSource(settings);
};

createDataSource.json = function(options) {
  const settings = Object.assign({
    packer: 'json',
  }, options);

  return createDataSource(settings);
};

createDataSource.jsonWithHexBuffers = function(options) {
  const settings = Object.assign({
    packer: 'json',
    bufferEncoding: 'hex',
  }, options);

  return createDataSource(settings);
};

beforeEach(function clearDatabase(done) {
  const ds = createDataSource();
  ds.connector.execute('FLUSHDB', function(err) {
    if (err) return done(err);
    ds.disconnect(done);
  });
});
