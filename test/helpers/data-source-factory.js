'use strict';

var DataSource = require('loopback-datasource-juggler').DataSource;
var connector = require('../..');
var extend = require('util')._extend;

var SETTINGS = {
  // FIXME when running on IBM JenkinsCI:
  // - use REDIS_HOST and REDIS_PORT,
  // - use unique DB number (PID % 16)
  host: 'localhost',
  connector: connector,
  // produce nicer stack traces
  showFriendlyErrorStack: true,
};

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
