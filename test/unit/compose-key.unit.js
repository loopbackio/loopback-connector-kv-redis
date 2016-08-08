'use strict';

var composeKey = require('../..')._Connector._composeKey;
var expect = require('../helpers/expect');

describe('RedisKeyValueConnector._composeKey', function() {
  it('honours the key', function() {
    var key1 = composeKey('Car', 'vin');
    var key2 = composeKey('Car', 'name');
    expect(key1).to.not.equal(key2);
  });

  it('honours the model name', function() {
    var key1 = composeKey('Product', 'name');
    var key2 = composeKey('Category', 'name');
    expect(key1).to.not.equal(key2);
  });

  it('encodes values', function() {
    // This test is based on the knowledge that we are using ':' separator
    // when building the composed string
    var key1 = composeKey('a', 'b:c');
    var key2 = composeKey('a:b', 'c');
    expect(key1).to.not.equal(key2);
  });
});
