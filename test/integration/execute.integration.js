'use strict';

var createDataSource = require('../helpers/data-source-factory');
var expect = require('../helpers/expect');

describe('execute', function() {
  it('returns "INFO keyspace" result as a Buffer', function(done) {
    var ds = createDataSource();
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
      var ds = createDataSource.json();
      ds.connector.execute('INFO', ['keyspace'], function(err, result) {
        if (err) return done(err);
        expect(result).to.be.instanceOf(Buffer);
        result = result.toString('utf8');
        expect(result).to.match(/^# Keyspace/);
        done();
      });
    });
});

