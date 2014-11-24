var CoreObject = require('core-object');
var CLIPromise = require('ember-cli/lib/ext/promise');

module.exports = CoreObject.extend({
  init: function() {
    this.store = {};
  },

  lpush: function(appId, key) {
    this.store[appId] = this.store[appId] || [];
    var length = this.store[appId].unshift(key);

    return CLIPromise.resolve(length);
  },
  lrange: function(appId, start, end) {
    var values = this.store[appId] || [];

    var result = values.slice(start, end + 1);

    return CLIPromise.resolve(result);
  },
  ltrim: function(appId, min, max) {
    var values = this.store[appId] || [];

    this.store[appId] = values.slice(min, max + 1);
    return CLIPromise.resolve('OK');
  },
  set: function(key, value) {
    this.store[key] = value;
    return CLIPromise.resolve('OK');
  },
  get: function(key) {
    return this.store[key];
  }
});
