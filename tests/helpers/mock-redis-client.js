var CoreObject = require('core-object');
var CLIPromise = require('ember-cli/lib/ext/promise');

module.exports = CoreObject.extend({
  lpush: function(appId, key) {
    this.appId = appId;
    this.key = key;
    return CLIPromise.resolve();
  },
  lrange: function(appId, start, end) {
    this.appId = appId;
    this.start = start;
    this.end = end;

    var result = ['key', 'a', 'b', 'c', 'd'].slice(start, end + 1);

    return CLIPromise.resolve(result);
  },
  ltrim: function(appId, min, max) {
    this.appId = appId;
    this.min = min;
    this.max = max;
    return CLIPromise.resolve();
  },
  set: function(key, value) {
    this.key = key;
    this.value = value;
    return CLIPromise.resolve();
  }
});
