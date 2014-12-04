var GitCommand  = require('gitty/lib/command');
var CoreObject  = require('core-object');
var SilentError = require('ember-cli/lib/errors/silent');
var CLIPromise  = require('ember-cli/lib/ext/promise');

var Adapter = CoreObject.extend({
  init: function() {
    if (!this.connection) {
      throw new SilentError('Adapter must define a `connection` property\n');
    }

    this.appId        = this.appId || 'default';
    this.client       = this.client|| this._client.apply(this);
    this.versionCount = this.versionCount || 15;
  },

  upload: function(data) {
    var key          = this._key();

    return this._uploadIfNotInVersionList(key, data)
      .then(this._updateVersionList.bind(this, key))
      .then(this._trimVersionList.bind(this))
      .then(function() {
        return key;
      });
  },

  setCurrent: function(key) {
    return this._setCurrentIfInVersionList(key);
  },

  listVersions: function(count){
    return this._listVersions(count).then(function(keys){
      return keys.map(function(key){
        // it may contain some additional fields
        // like lastTimeActivated etc
        return { sha1: key };
      });
    });
  },

  _key: function() {
    var cmd = new GitCommand('./', 'rev-parse', ['--short=10'], 'HEAD');
    return cmd.execSync().trim();
  },

  _uploadIfNotInVersionList: function(key, value) {
    var self     = this;
    var redisKey = this.appId + ':' + key;

    return this._listVersions()
      .then(function(keys) {
        if (keys.indexOf(key) === -1) {
          return self._set(redisKey, value);
        } else {
          var message = 'Version for key [' + key + ']' + ' has already been uploaded\n';
          return CLIPromise.reject(new SilentError(message));
        }
      });
  },

  _setCurrentIfInVersionList: function(key) {
    var self  = this;
    var appId = this.appId;

    return this._listVersions()
      .then(function(versions) {
        if (versions.indexOf(key) === -1) {
          var message = 'Version for key [' + key + ']' + ' does not exist\n';
          return CLIPromise.reject(new SilentError(message));
        } else {
          return self._set(appId + ':current', key);
        }
      });
  },

  _updateVersionList: function(key) {
    var self = this;

    return this._listVersions()
      .then(function(keys) {
        if (keys.indexOf(key) === -1) {
          return self.client.lpush(self.appId, key);
        } else {
          var message = 'Version for key [' + key + ']' + ' has already been uploaded\n';
          return CLIPromise.reject(new SilentError(message));
        }
      });
  },

  _trimVersionList: function() {
    return this.client.ltrim(this.appId, 0, this.versionCount - 1);
  },

  _listVersions: function(count) {
    count = count || this.versionCount;
    return this.client.lrange(this.appId, 0, count - 1);
  },

  _set: function(key, value) {
    return this.client.set(key, value);
  },

  _client: function() {
    return require('romis').createClient(this.connection.port, this.connection.host, {
      auth_pass: this.connection.password
    });
  }
});

Adapter.type = 'index-adapter';

module.exports = Adapter;
