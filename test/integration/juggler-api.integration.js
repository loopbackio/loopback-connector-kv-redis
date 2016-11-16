'use strict';

var createDataSource = require('../helpers/data-source-factory');
var expect = require('../helpers/expect');
var kvaoTestSuite = require('loopback-datasource-juggler/test/kvao.suite.js');

describe('Juggler API', function() {
  context('using binary packer', function() {
    kvaoTestSuite(createDataSource);
  });

  context('using json-string packer', function() {
    kvaoTestSuite(createDataSource.json);
  });

  context('using json-string packer with hex buffers', function() {
    kvaoTestSuite(createDataSource.jsonWithHexBuffers);
  });
});
