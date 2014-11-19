'use strict';

var assert     = require('ember-cli/tests/helpers/assert');
var CLIPromise = require('ember-cli/lib/ext/promise');
var MockClient = require('../helpers/mock-redis-client');
var Adapter    = require('../../lib/redis-index-adapter');

describe('redis-index-adpater', function(){
  var mockClient;
  var adapterOptions;
  var succeeded, failed;

  beforeEach(function() {
    mockClient = new MockClient();

    adapterOptions = {
      connection: {},
      appId: 'my-app',
      versionCount: 4,
      client: mockClient
    };

    succeeded = function() {
      return CLIPromise.resolve('succeeded');
    }

    failed = function() {
      return CLIPromise.reject('failed');
    }
  });

  describe('initialization', function() {
    it('throws error if initiated without config', function() {
      try {
        new Adapter();
      } catch(e) {
        assert.equal(e.message, 'Adapter must define a `connection` property\n');

        return;
      }

      assert.ok(false, 'Should have thrown an exception');
    });

    it('sets the appId if supplied', function() {
      var subject = new Adapter(adapterOptions);

      assert.equal(subject.appId, 'my-app');
    });

    it('uses the default appId if one is not supplied', function() {
      delete adapterOptions.appId;

      var subject = new Adapter(adapterOptions);

      assert.equal(subject.appId, 'default');
    });

    it('sets the redis client if supplied', function() {
      var subject = new Adapter(adapterOptions);

      assert.equal(subject.client, mockClient);
    });

    it('sets the maximum version count if supplied', function() {
      var subject = new Adapter(adapterOptions);

      assert.equal(subject.versionCount, 4);
    });

    it('uses the default maximum version count if not supplied', function() {
      delete adapterOptions.versionCount;

      var subject = new Adapter(adapterOptions);

      assert.equal(subject.versionCount, 15);
    });
  });

  describe('#upload', function() {
    it('rejects if the version is already uploaded', function() {
      mockClient.set('aaa', 'data');
      mockClient.lpush(adapterOptions.appId, 'aaa');

      var subject = new Adapter(adapterOptions);

      subject._key = function() {
        return 'aaa';
      };

      return subject.upload('data')
        .then(function() {
          assert.ok(false, 'Should have rejected due to version already being uploaded');
        }, function(error) {
          assert.equal(error.message, 'Version for key [aaa] has already been uploaded\n');
        });
    });

    it('maintains the version list to be at the specified number of versions', function() {
      for(var i = 0; i < 4; i++) {
        mockClient.lpush(adapterOptions.appId, 'version-' + i);
      }
      var subject = new Adapter(adapterOptions);

      subject._key = function() {
        return 'aaa';
      };

      assert.equal(mockClient.get(adapterOptions.appId).indexOf('aaa'), -1);

      return subject.upload('data')
        .then(function() {
          assert.equal(mockClient.get(adapterOptions.appId).length, 4);
          assert.equal(mockClient.get(adapterOptions.appId)[0], 'aaa');
        }, function(error) {
          assert.ok(false, 'Should have resolved');
        });
    });

    it('returns the key for which the data was uploaded', function() {
      var subject = new Adapter(adapterOptions);

      subject._key = function() {
        return 'aaa';
      };

      return subject.upload('data')
        .then(function(key) {
          assert.equal(key, 'aaa');
        }, function() {
          assert.ok(false, 'Should have resolved with upload key');
        });
    });
  });

  describe('#setCurrent', function() {
    it('rejects if the version has not been previously uploaded', function() {
      var subject = new Adapter(adapterOptions);

      return subject.setCurrent('aaa')
        .then(function() {
          assert.ok(false, 'Should have rejected');
        }, function(error) {
          assert.equal(error.message, 'Version for key [aaa] does not exist\n');
          var currentKey = mockClient.get(adapterOptions.appId + ':current');
          assert.equal(currentKey, null);
        });
    });

    it('sets the specified version as the current version', function() {
      var subject = new Adapter(adapterOptions);

      subject._key = function() {
        return 'aaa';
      };

      return subject.upload('data')
        .then(function(key) {
          return subject.setCurrent(key)
            .then(function() {
              var currentKey = mockClient.get(adapterOptions.appId + ':current');
              assert.equal(currentKey, key);
            }, function() {
              assert.ok(false, 'Should have resolved');
            });
        });
    });
  });
});
