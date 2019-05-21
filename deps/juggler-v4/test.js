// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: loopback-connector-postgresql
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

'use strict';

const createDataSource = require('../../test/helpers/data-source-factory');
const kvaoTestSuite = require('loopback-datasource-juggler/test/kvao.suite.js');
const juggler = require('loopback-datasource-juggler');
const name = require('./package.json').name;

describe(name, function() {
  before(function() {
    return createDataSource.resetDataSourceClass(juggler.DataSource);
  });

  after(function() {
    return createDataSource.resetDataSourceClass();
  });

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
