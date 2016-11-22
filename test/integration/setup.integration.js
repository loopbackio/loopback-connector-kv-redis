'use strict';

var createDataSource = require('../helpers/data-source-factory');
var expect = require('../helpers/expect');

describe('setup', function() {
  it('reports connection errors by default', function(done) {
    var ds = createDataSource.failing({lazyConnect: false});

    ds.once('error', function(err) {
      expect(err.message).to.contain('ECONNREFUSED');
      ds.disconnect(done);
    });
  });

  context('with lazyConnect:true', function() {
    it('does not connect at setup time', function(done) {
      var ds = createDataSource.failing({lazyConnect: true});

      // Assume no connection was made if there is no error reported
      // within reasonable time. The test passes in such case.
      var errTimeout = setTimeout(function() { done(); }, 1000);

      ds.once('error', function(err) {
        clearTimeout(errTimeout);
        done(err);
      });
    });

    it('reports connection failure on the first command', function(done) {
      var ds = createDataSource.failing({lazyConnect: true});
      ds.ping(function(err) {
        // NOTE(bajtos) This depends on the current behaviour of ioredis.
        // Currently, ioredis does not surface the original connection error
        // in lazy-connect mode.
        expect(err.message).to.contain('Connection is closed.');
        done();
      });
    });
  });

  it('favours user-defined URL settings', function(done) {
    var host = process.env.REDIS_HOST || 'localhost';
    var port = +process.env.REDIS_PORT || 6379;
    var db = process.pid % 16;
    var url = 'redis://' + host + ':' + port + '/' + db;
    var ds = createDataSource({
      url: url,
      host: 'invalid-host',
      port: 'invalid-port',
    });
    var driverSettings = ds.connector._client.options;
    expect(driverSettings.port).to.not.equal('invalid-host');
    expect(driverSettings.host).to.equal(host);
    expect(driverSettings.port).to.not.equal('invalid-port');
    expect(driverSettings.port).to.equal(port);
    expect(driverSettings.db).to.equal(db);
    ds.ping(done);
  });
});
