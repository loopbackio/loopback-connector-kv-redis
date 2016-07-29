'use strict';

var assert = require('assert');
var Connector = require('loopback-connector').Connector;
var debug = require('debug')('loopback:connector:kv-redis');
var Redis = require('ioredis');
var Command = Redis.Command;
var util = require('util');

exports.initialize = function initializeDataSource(dataSource, callback) {
  var settings = dataSource.settings;

  dataSource.connector = new RedisKeyValueConnector(settings, dataSource);

  if (!callback) return;

  if (settings.lazyConnect) {
    return process.nextTick(callback);
  }

  dataSource.connector._client
    .once('connect', function() { callback(); })
    .once('error', callback);
};

function RedisKeyValueConnector(settings, dataSource) {
  Connector.call(this, 'kv-redis', settings);
  this.dataSource = dataSource;

  debug('Connector settings', settings);

  this._client = new Redis(settings.url || settings);

  this.DataAccessObject = function() {
    // FIXME use KV DAO from juggler instead
  };
};

util.inherits(RedisKeyValueConnector, Connector);

RedisKeyValueConnector.prototype.ping = function(cb) {
  this.execute('ping', cb);
};

RedisKeyValueConnector.prototype.execute = function(command, args, cb) {
  if (cb === undefined && typeof args === 'function') {
    cb = args;
    args = [];
  }

  assert(typeof command === 'string', 'command must be a string');
  assert(typeof cb === 'function', 'callback must be a function');

  debug('EXECUTE %j %j', command, args);
  var cmd = new Command(command, args, 'utf8', function(err, result) {
    debug('RESULT OF %j -- %j', command, result);
    cb(err, result);
  });
  this._client.sendCommand(cmd);
};

RedisKeyValueConnector.prototype.disconnect = function(cb) {
  this._client.quit(cb);
};
