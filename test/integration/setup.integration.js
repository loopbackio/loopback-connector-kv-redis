// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-kv-redis
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const createDataSource = require('../helpers/data-source-factory');
const expect = require('../helpers/expect');

describe('setup', function() {
  it('reports connection errors by default', function(done) {
    const ds = createDataSource.failing({lazyConnect: false});

    ds.once('error', function(err) {
      expect(err.message).to.contain('ECONNREFUSED');
      ds.disconnect(done);
    });
  });

  context('with lazyConnect:true', function() {
    it('does not connect at setup time', function(done) {
      const ds = createDataSource.failing({lazyConnect: true});

      // Assume no connection was made if there is no error reported
      // within reasonable time. The test passes in such case.
      const errTimeout = setTimeout(function() { done(); }, 1000);

      ds.once('error', function(err) {
        clearTimeout(errTimeout);
        done(err);
      });
    });

    it('reports connection failure on the first command', function(done) {
      const ds = createDataSource.failing({lazyConnect: true});
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
    const host = process.env.REDIS_HOST || 'localhost';
    const port = +process.env.REDIS_PORT || 6379;
    const db = process.pid % 16;
    const url = 'redis://' + host + ':' + port + '/' + db;
    const ds = createDataSource({
      url: url,
      host: 'invalid-host',
      port: 'invalid-port',
    });
    const driverSettings = ds.connector._client.options;
    expect(driverSettings.port).to.not.equal('invalid-host');
    expect(driverSettings.host).to.equal(host);
    expect(driverSettings.port).to.not.equal('invalid-port');
    expect(driverSettings.port).to.equal(port);
    expect(driverSettings.db).to.equal(db);
    ds.ping(done);
  });
});
