'use strict';

var DataSource = require('loopback-datasource-juggler').DataSource;
var connector = require('../..');

var SETTINGS = {
  // FIXME when running on IBM JenkinsCI:
  // - use REDIS_HOST and REDIS_PORT,
  // - use unique DB number (PID % 16)
  url: 'redis://localhost',
  connector: connector,
};

function createDataSource() {
  return new DataSource(SETTINGS);
};
module.exports = createDataSource;

beforeEach(function clearDatabase(done) {
  createDataSource().connector.execute('FLUSHDB', done);
});
