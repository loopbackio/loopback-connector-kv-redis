'use strict';

const SG = require('strong-globalize');
SG.SetRootDir(__dirname + '/..');
const g = SG();

const assert = require('assert');
const connectorCore = require('loopback-connector');
const Connector = connectorCore.Connector;
const ModelKeyComposer = connectorCore.ModelKeyComposer;
const BinaryPacker = connectorCore.BinaryPacker;
const JSONStringPacker = connectorCore.JSONStringPacker;
const debug = require('debug')('loopback:connector:kv-redis');
const Redis = require('ioredis');
const util = require('util');

/**
 * @module loopback-connector-kv-redis
 *
 * Initialize the KeyValue Redis connector against the given data source.
 *
 * @param {DataSource} dataSource The `loopback-datasource-juggler` dataSource.
 * @callback {Function} callback
 * @param {Error} err Error Object.
 *
 * @header RedisKeyValueConnector.initialize(dataSource, cb)
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
  const settings = dataSource.settings;

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

/**
 * @constructor
 *
 * Constructor for the KeyValue Redis connector.
 *
 * @param {Object} settings
 * @param {DataSource} dataSource The data source instance.
 *
 * @header RedisKeyValueConnector(settings, dataSource)
 */
function RedisKeyValueConnector(settings, dataSource) {
  Connector.call(this, 'kv-redis', settings);
  this.dataSource = dataSource;

  debug('Connector settings', settings);

  this._client = new Redis(settings.url || settings);
  if (settings.packer && settings.packer === 'json') {
    this._packer = new JSONStringPacker(settings.bufferEncoding);
  } else {
    this._packer = new BinaryPacker();
  }
  this.DataAccessObject = dataSource.juggler.KeyValueAccessObject;
};

util.inherits(RedisKeyValueConnector, Connector);

/**
 * Returns "PONG". Used to verify connectivity to the data source.
 *
 * @callback {Function} callback
 * @param {Error} err Error object.
 * @param {String} message The "PONG" message string.
 *
 * @header RedisKeyValueConnector.prototype.ping(cb)
 */
RedisKeyValueConnector.prototype.ping = function(cb) {
  this.execute('ping', cb);
};

/**
 * Execute a Redis command.
 *
 * @param {String} command The Redis command to execute.
 * @param {Array} args List of options for the given command.
 * @callback {Function} callback
 * @param {Error} err Error object.
 * @param {*} result The result of the command execution.
 *
 * @header RedisKeyValueConnector.prototype.execute(command, args, cb)
 */
RedisKeyValueConnector.prototype.execute = function(command, args, cb) {
  if (cb === undefined && typeof args === 'function') {
    cb = args;
    args = [];
  }

  assert(typeof command === 'string', 'command must be a string');
  assert(typeof cb === 'function', 'callback must be a function');

  command = command.toLowerCase();

  debug('EXECUTE %j %j', command, args);
  const cmd = new Redis.Command(command, args, 'utf8', function(err, result) {
    debug('RESULT OF %j -- %j', command, result);
    cb(err, result);
  });
  this._client.sendCommand(cmd);
};

/**
 * Disconnect from the data source.
 *
 * @callback {Function} callback
 * @param {Error} err Error object.
 *
 * @header RedisKeyValueConnector.prototype.disconnect(cb)
 */
RedisKeyValueConnector.prototype.disconnect = function(cb) {
  this._client.quit(cb);
};

/**
 * Persist a value and associate it with the given key.
 *
 * @param {String} modelName The model name to associate with the given key.
 * @param {String} key Key to associate with the given value.
 * @param {*} value Value to persist.
 * @options {Object} options
 * @property {Number} ttl TTL (time to live) for the key-value pair in ms
 *   (milliseconds).
 * @callback {Function} callback
 * @param {Error} err Error object.
 *
 * @header RedisKeyValueConnector.prototype.set(modelName, key, value, cb)
 */
RedisKeyValueConnector.prototype.set =
function(modelName, key, value, options, callback) {
  const self = this;
  ModelKeyComposer.compose(modelName, key, function(err, composedKey) {
    if (err) return callback(err);
    self._packer.encode(value, function(err, rawData) {
      if (err) return callback(err);

      const args = [composedKey, rawData];
      if (options.ttl) {
        args.push('PX');
        args.push(options.ttl);
      }

      self.execute('SET', args, callback);
    });
  });
};

/*
 * Return the value associated with a given key.
 *
 * @param {String} modelName The model name to associate with the given key.
 * @param {String} key Key to use when searching the database.
 * @options {Object} options
 * @callback {Function} callback
 * @param {Error} err Error object.
 * @param {*} result Value associated with the given key.
 *
 * @header RedisKeyValueConnector.prototype.get(modelName, key, cb)
 */
RedisKeyValueConnector.prototype.get =
function(modelName, key, options, callback) {
  const self = this;
  ModelKeyComposer.compose(modelName, key, function(err, composedKey) {
    if (err) return callback(err);
    self.execute('GET', [composedKey], function(err, rawData) {
      if (err) return callback(err);
      if (rawData === null) {
        return callback(null, null);
      }
      self._packer.decode(rawData, callback);
    });
  });
};

/**
 * Set the TTL (time to live) in ms (milliseconds) for a given key. TTL is the
 * remaining time before a key-value pair is discarded from the database.
 *
 * @param {String} modelName The model name to associate with the given key.
 * @param {String} key Key to use when searching the database.
 * @param {Number} ttl TTL in ms to set for the key.
 * @options {Object} options
 * @callback {Function} callback
 * @param {Error} err Error object.
 *
 * @header RedisKeyValueConnector.prototype.expire(modelName, key, ttl, cb)
 */
RedisKeyValueConnector.prototype.expire =
function(modelName, key, ttl, options, callback) {
  const self = this;
  ModelKeyComposer.compose(modelName, key, function(err, composedKey) {
    if (err) return callback(err);
    self.execute('PEXPIRE', [composedKey, ttl], function(err, result) {
      if (err) return callback(err);
      if (!result) {
        const err = new Error(g.f(
          'Key does not exist or the timeout cannot be set. ' +
          'Model: %s Key: %s', modelName, key));
        err.statusCode = 404;
        return callback(err);
      }
      callback();
    });
  });
};

/**
 * Return the TTL (time to live) for a given key. TTL is the remaining time
 * before a key-value pair is discarded from the database.
 *
 * @param {String} modelName The model name to associate with the given key.
 * @param {String} key Key to use when searching the database.
 * @options {Object} options
 * @callback {Function} callback
 * @param {Error} error
 * @param {Number} ttl Expiration time for the key-value pair. `undefined` if
 *   TTL was not initially set.
 *
 * @header RedisKeyValueConnector.prototype.ttl(modelName, key, cb)
 */
RedisKeyValueConnector.prototype.ttl =
function(modelName, key, options, callback) {
  const self = this;
  ModelKeyComposer.compose(modelName, key, function(err, composedKey) {
    if (err) return callback(err);
    self.execute('PTTL', [composedKey], function(err, result) {
      if (err) return callback(err);
      // key does not exist
      if (!result || result === -2) {
        const err = new Error(g.f(
          'Cannot get TTL for unknown key. ' +
          'Model: %s Key: %s', modelName, key));
        err.statusCode = 404;
        return callback(err);
      }
      // key exists but has no associated expire
      if (result == -1) {
        return callback(null, undefined);
      }
      callback(null, result);
    });
  });
};

/**
 * Delete the key-value pair associated to the given key.
 *
 * @param {String} modelName The model name to associate with the given key.
 * @param {String} key Key to associate with the given value.
 * @options {Object} options Unused ATM, placeholder for future options.
 * @callback {Function} callback
 * @param {Error} err Error object.
 *
 * @header RedisKeyValueConnector.prototype.delete(modelName, key, cb)
 */
RedisKeyValueConnector.prototype.delete =
function(modelName, key, options, callback) {
  const self = this;
  ModelKeyComposer.compose(modelName, key, function(err, composedKey) {
    if (err) return callback(err);

    self.execute('DEL', [composedKey], callback);
  });
};

/**
 * Asynchronously iterate all keys in the database. Similar to `.keys()` but
 * instead allows for iteration over large data sets without having to load
 * everything into memory at once.
 *
 * @param {String} modelName The model name to associate with the given key.
 * @param {Object} filter An optional filter object with the following
 * @param {String} filter.match Glob string to use to filter returned
 *   keys (i.e. `userid.*`).
 * @param {Object} options
 * @returns {AsyncIterator} An Object implementing `next(cb) -> Promise`
 *   function that can be used to iterate all keys.
 *
 * @header RedisKeyValueConnector.prototype.iterateKeys(modelName, filter)
 */
RedisKeyValueConnector.prototype.iterateKeys =
function(modelName, filter, options, callback) {
  const keyPattern = filter.match || '*';

  const self = this;
  let cursor = null;
  let cache = [];

  return {
    next: getNextKey,
  };

  function getNextKey(cb) {
    if (cache.length)
      return takeNextFromCache(cb);

    if (cursor === '0')
      return reportEnd(cb);

    fetchFromRedis(cb);
  }

  function takeNextFromCache(cb) {
    const value = cache.shift();
    ModelKeyComposer.parse(value, function(err, parsed) {
      if (err && err.code == 'NO_MODEL_PREFIX') {
        err = null;
        parsed = {modelName: null, key: value};
      }

      if (err) return cb(err);

      if (parsed.modelName !== modelName) {
        g.warn(
          'Warning: key scan returned a key beloging to a wrong model.' +
            '\nExpected model name: %j' +
            '\nActual model name:   %j' +
            '\nThe key: %j',
          modelName, parsed.modelName, value);
      }

      cb(null, parsed.key);
    });
  }

  function reportEnd(cb) {
    setImmediate(function() {
      cb();
    });
  }

  function fetchFromRedis(cb) {
    if (cursor === null) cursor = '0';

    ModelKeyComposer.compose(modelName, keyPattern, function(err, pattern) {
      if (err) return cb(err);
      self.execute('SCAN', [cursor, 'MATCH', pattern], function(err, result) {
        if (err) return cb(err);
        cursor = result[0].toString('utf8');
        cache = result[1].map(function(it) { return it.toString('utf8'); });
        getNextKey(cb);
      });
    });
  }
};
