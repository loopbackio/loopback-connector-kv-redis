'use strict';

var createDataSource = require('../helpers/data-source-factory');
var expect = require('../helpers/expect');

describe('Juggler API', function() {
  require('loopback-datasource-juggler/test/kvao.suite.js')(createDataSource);
});
