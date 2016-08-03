'use strict';
var createDataSource = require('../helpers/data-source-factory');

describe('ping', function() {
  it('returns with no error', function(done) {
    var ds = createDataSource();
    ds.ping(done);
  });
});
