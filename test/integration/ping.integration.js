'use strict';
const createDataSource = require('../helpers/data-source-factory');

describe('ping', function() {
  it('returns with no error', function(done) {
    const ds = createDataSource();
    ds.ping(done);
  });
});
