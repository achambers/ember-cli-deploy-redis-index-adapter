'use strict';

var RedisIndexAdapter = require('./lib/redis-index-adapter');

function EmberCLIDeployRedisIndexAdapter() {
  this.name = 'ember-cli-deploy-redis-index-adapter';
  this.adapter = RedisIndexAdapter;
}

module.exports = EmberCLIDeployRedisIndexAdapter;
