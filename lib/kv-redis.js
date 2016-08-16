'use strict';

var SG = require('strong-globalize');
SG.SetRootDir(__dirname + '/..');
var g = SG();

var assert = require('assert');
var Connector = require('loopback-connector').Connector;
var createPacker = require('./packer');
var debug = require('debug')('loopback:connector:kv-redis');
var Redis = require('ioredis');
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

exports._Connector = RedisKeyValueConnector;

function RedisKeyValueConnector(settings, dataSource) {
  Connector.call(this, 'kv-redis', settings);
  this.dataSource = dataSource;

  debug('Connector settings', settings);

  this._client = new Redis(settings.url || settings);
  this._packer = createPacker();
  this.DataAccessObject = dataSource.juggler.KeyValueAccessObject;
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
  var cmd = new Redis.Command(command, args, 'utf8', function(err, result) {
    debug('RESULT OF %j -- %j', command, result);
    cb(err, result);
  });
  this._client.sendCommand(cmd);
};

RedisKeyValueConnector.prototype.disconnect = function(cb) {
  this._client.quit(cb);
};

RedisKeyValueConnector.prototype.set =
function(modelName, key, value, options, callback) {
  var composedKey = RedisKeyValueConnector._composeKey(modelName, key);
  var rawData = this._packer.encode(value).slice();

  var args = [composedKey, rawData];
  if (options.ttl) {
    args.push('PX');
    args.push(options.ttl);
  }

  this.execute('SET', args, callback);
};

RedisKeyValueConnector.prototype.get =
function(modelName, key, options, callback) {
  var composedKey = RedisKeyValueConnector._composeKey(modelName, key);
  var packer = this._packer;
  this.execute('GET', [composedKey], function(err, rawData) {
    if (err) return callback(err);
    var value = rawData !== null ? packer.decode(rawData) : null;
    callback(null, value);
  });
};

RedisKeyValueConnector.prototype.expire =
function(modelName, key, ttl, options, callback) {
  var composedKey = RedisKeyValueConnector._composeKey(modelName, key);
  this.execute('PEXPIRE', [composedKey, ttl], function(err, result) {
    if (err) return callback(err);
    if (!result) {
      var err = new Error(g.f(
        'Key does not exist or the timeout cannot be set. ' +
        'Model: %s Key: %s', modelName, key));
      err.statusCode = 404;
      return callback(err);
    }
    callback();
  });
};

RedisKeyValueConnector._composeKey = function(modelName, key) {
  // FIXME escape values to prevent collision
  //  'model' + 'foo:bar' vs 'model:foo' + 'bar'
  return encodeURIComponent(modelName) + ':' + key;
};
