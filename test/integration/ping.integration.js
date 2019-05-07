// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-kv-redis
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const createDataSource = require('../helpers/data-source-factory');

describe('ping', function() {
  it('returns with no error', function(done) {
    const ds = createDataSource();
    ds.ping(done);
  });
});
