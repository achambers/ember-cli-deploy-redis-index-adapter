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
    it('proceeds if index is uploaded and returns the key', function() {
      adapterOptions._uploadIfNotInVersionList = succeeded;
      adapterOptions._updateVersionList        = succeeded;
      adapterOptions._trimVersionList          = succeeded;

      var subject = new Adapter(adapterOptions);

      return subject.upload('data')
        .then(function(key) {
          assert.ok(/[0-9a-f]{10}/.test(key));
        }, function(error) {
          assert.ok(false, 'Should have resolved upload');
        });
    });

    it('rejects if index is not uploaded', function() {
      adapterOptions._uploadIfNotInVersionList = failed;
      adapterOptions._updateVersionList        = succeeded;
      adapterOptions._trimVersionList          = succeeded;

      var subject = new Adapter(adapterOptions);

      return subject.upload('data')
        .then(function() {
          assert.ok(false, 'Should have rejected upload');
        }, function(error) {
          assert.equal(error, 'failed');
        });
    });

    it('rejects if version list is not updated', function() {
      adapterOptions._uploadIfNotInVersionList = succeeded;
      adapterOptions._updateVersionList        = failed;
      adapterOptions._trimVersionList          = succeeded;

      var subject = new Adapter(adapterOptions);

      return subject.upload('data')
        .then(function() {
          assert.ok(false, 'Should have rejected upload');
        }, function(error) {
          assert.equal(error, 'failed');
        });
    });

    it('rejects if version list is not trimmed', function() {
      adapterOptions._uploadIfNotInVersionList = succeeded;
      adapterOptions._updateVersionList        = succeeded;
      adapterOptions._trimVersionList          = failed;

      var subject = new Adapter(adapterOptions);

      return subject.upload('data')
        .then(function() {
          assert.ok(false, 'Should have rejected upload');
        }, function(error) {
          assert.equal(error, 'failed');
        });
    });
  });

  describe('#_key', function() {
    it('returns the current git hash', function() {
      var subject = new Adapter(adapterOptions);

      var sha = subject._key();

      assert.ok(/[0-9a-f]{10}/.test(sha), 'Should return hash');
    });
  });

  describe('#_uploadIfNotInVersionList', function() {
    it('resolves on a successful upload', function() {
      var subject = new Adapter(adapterOptions);

      return subject._uploadIfNotInVersionList('new-key', 'value')
        .then(function() {
          assert.equal(mockClient.key, 'my-app:new-key');
          assert.equal(mockClient.value, 'value');
        }, function() {
          assert.ok(false, 'Should have uploaded successfully');
        });
    });

    it('rejects if a version already exists for the current git sha', function() {
      var subject = new Adapter(adapterOptions);

      return subject._uploadIfNotInVersionList('key', 'value')
        .then(function() {
          assert.ok(false, 'Should have rejected due to version already being uploaded');
        }, function(error) {
          assert.equal(error.message, 'Version for key [key] has already been uploaded\n');
        });
    });
  });

  describe('#_updateVersionList', function() {
    it('resolves on a successful update', function() {
      var subject = new Adapter(adapterOptions);

      return subject._updateVersionList('new-key')
        .then(function() {
          assert.equal(mockClient.appId, 'my-app');
          assert.equal(mockClient.key, 'new-key');
        }, function() {
          assert.ok(false, 'Should have updated versions successfully');
        });
    });

    it('rejects if a version already exists for the current git sha', function() {
      var subject = new Adapter(adapterOptions);

      return subject._updateVersionList('key')
        .then(function() {
          assert.ok(false, 'Should have rejected due to version already being in version list');
        }, function(error) {
          assert.equal(error.message, 'Version for key [key] has already been uploaded\n');
        });
    });
  });

  describe('#_trimVersions', function() {
    it('resolves on a successful call', function() {
      adapterOptions.versionCount = 5;

      var subject = new Adapter(adapterOptions);

      return subject._trimVersionList()
        .then(function() {
          assert.equal(mockClient.appId, 'my-app');
          assert.equal(mockClient.min, 0);
          assert.equal(mockClient.max, 4);
        }, function() {
          assert.ok(false, 'Should have trimmed the version list successfully');
        });
    });
  });

  describe('#_listVersions', function() {
    it('returns the number of versions specified', function() {
      var subject = new Adapter(adapterOptions);

      return subject._listVersions(3)
        .then(function(result) {
          assert.equal(result.length, 3);
        }, function() {
          assert.ok(false, 'Should have returned specified number of versions');
        });
    });

    it('returns the default number of versions when count not specified', function() {
      var subject = new Adapter(adapterOptions);

      return subject._listVersions()
        .then(function(result) {
          assert.equal(result.length, 4);
        }, function() {
          assert.ok(false, 'Should have returned specified number of versions');
        });
    });
  });
});
