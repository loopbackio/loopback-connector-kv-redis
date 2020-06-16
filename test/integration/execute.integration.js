// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-kv-redis
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const createDataSource = require('../helpers/data-source-factory');
const expect = require('../helpers/expect');

describe('execute', function() {
  it('returns "INFO keyspace" result as a Buffer', function(done) {
    const ds = createDataSource();
    ds.connector.execute('INFO', ['keyspace'], function(err, result) {
      if (err) return done(err);
      expect(result).to.be.instanceOf(Buffer);
      result = result.toString('utf8');
      expect(result).to.match(/^# Keyspace/);
      done();
    });
  });

  it('returns "INFO keyspace" result as a Buffer w/ json packer',
    function(done) {
      const ds = createDataSource.json();
      ds.connector.execute('INFO', ['keyspace'], function(err, result) {
        if (err) return done(err);
        expect(result).to.be.instanceOf(Buffer);
        result = result.toString('utf8');
        expect(result).to.match(/^# Keyspace/);
        done();
      });
    });

  it('accepts 4 arguments to support DataSource.prototype.execute',
    async function() {
      const ds = createDataSource();
      const result = await ds.execute('INFO', ['keyspace'], {});
      expect(result).to.be.instanceOf(Buffer);
    });
});
