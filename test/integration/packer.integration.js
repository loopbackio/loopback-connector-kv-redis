'use strict';

var createDataSource = require('../helpers/data-source-factory');
var expect = require('../helpers/expect');
var extend = require('util')._extend;

describe('packer option', function() {
  it('changes storage format to JSON', function(done) {
    var ds = createDataSource.json();
    var value = {
      name: 'a-string',
      age: 42,
      flag: true,
      date: new Date(),
    };

    ds.connector.set('TestModel', 'a-key', value, {}, function(err) {
      if (err) return done(err);
      ds.connector.execute('GET', ['TestModel:a-key'], function(err, result) {
        if (err) return done(err);
        var stored = JSON.parse(result.toString());
        var expected = JSON.parse(JSON.stringify(value));
        expect(stored).to.eql(expected);
        done();
      });
    });
  });
});
