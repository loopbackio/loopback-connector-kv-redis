'use strict';

const createDataSource = require('../helpers/data-source-factory');
const expect = require('../helpers/expect');
const extend = require('util')._extend;

describe('packer option', function() {
  it('changes storage format to JSON', function(done) {
    const ds = createDataSource.json();
    const value = {
      name: 'a-string',
      age: 42,
      flag: true,
      date: new Date(),
    };

    ds.connector.set('TestModel', 'a-key', value, {}, function(err) {
      if (err) return done(err);
      ds.connector.execute('GET', ['TestModel:a-key'], function(err, result) {
        if (err) return done(err);
        const stored = JSON.parse(result.toString());
        const expected = JSON.parse(JSON.stringify(value));
        expect(stored).to.eql(expected);
        done();
      });
    });
  });
});
