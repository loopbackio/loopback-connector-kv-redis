'use strict';

var DataSource = require('loopback-datasource-juggler').DataSource;
var connector = require('../..');
var extend = require('util')._extend;

var SETTINGS = {
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
  var settings = extend({}, SETTINGS);
  settings = extend(settings, options);

  return new DataSource(settings);
};

module.exports = createDataSource;

var invalidPort = 4; // invalid port where nobody is listening

createDataSource.failing = function(options) {
  var settings = extend({
    host: '127.0.0.1',
    port: invalidPort++,

    // disable auto-reconnect
    retryStrategy: null,
    reconnectOnError: null,
  }, options);

  return createDataSource(settings);
};

beforeEach(function clearDatabase(done) {
  var ds = createDataSource();
  ds.connector.execute('FLUSHDB', function(err) {
    if (err) return done(err);
    ds.disconnect(done);
  });
});
