// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-kv-redis
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const createDataSource = require('../helpers/data-source-factory');
const expect = require('../helpers/expect');

describe('modelName', function() {
  it('returns default model name', () => {
    const ds = createDataSource();
    const modelName = 'TestModel';
    const Model = ds.createModel(modelName);

    const resolvedModel = ds.connector.modelName(modelName);
    expect(resolvedModel).to.be.equal(Model.modelName);
  });

  it('returns resolved model name', () => {
    const ds = createDataSource();
    const customTestModelName = 'CustomTestModel';

    const Model = ds.createModel('TestModel', undefined, {
      'kv-redis': {
        modelName: customTestModelName,
      },
    });

    const resolvedModel = ds.connector.modelName(Model.modelName);
    expect(resolvedModel).to.be.equal(customTestModelName);
  });
});

