# ember-cli-deploy-redis-index-adapter

> An Index Adapter for use with ember-cli-deploy to upload the index.html to Redis

## Motivation

This addon is a pluggable [adapter][3] to be used with [ember-cli-deploy][1].  This allows users to choose which backend they would like to upload their index.html files to.

For more information on what [ember-cli-deploy][1] adapters are and how they work, visit [https://github.com/achambers/ember-cli-deploy][3]

## Construction

The following properties can be set when creating an instance of this adapter:

### connection (required)

Type: Object

The connection properties that allow this adapter to connect to a Redis store.

```javascript
{
  host: 'localhost', //Redis host, defaults to localhost if not supplied
  port: '6397', //Redis port, defaults to 6379 if not supplied
  password: 'some-password' //Redis password, defaults to null if not supplied
}
```

### appId (optional)

Type: String

Defaults to: 'default'

The identifier of the application who is using this adapter.  This will make up the Redis key for which the index.html is uploaded.

### versionCount (optional)

Type: Integer

Defaults to: 15

The number of previous versions that should be stored in Redis.

## Interface

The following functions are implemented in this adapter:

### \#upload(data)

This function will upload the specified data to the Redis store specified by the `connection` properties that [ember-cli-deploy][1] passes in at construction time.

Firstly, this function will push the data to Redis with a key generated from the `appId` property appended to the current git sha of the [Ember CLI][2] project.  So an example Redis key will look something like `appId:abcde12345`.

Secondly, the function will keep track of the versions of `data` that have been uploaded already by pushing the Redis key onto a list keyed by the `appId`.  If the `data` for the current Redis key has already been uploaded, then an error will be thrown.

Finally, this function will trim the list of uploaded versions to a limit defined by `versionCount`.

## Installation

From within your [Ember CLI][2] application, run:

```shell
npm install --save-dev ember-cli-deploy-redis-index-adapter
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality.

## Maintainers

- Aaron Chambers (achambers@gmail.com)

## Release History

- [v0.0.1][4]


[1]: https://github.com/achambers/ember-cli-deploy "ember-cli-deploy"
[2]: http://ember-cli.com "Ember CLI"
[3]: https://github.com/achambers/ember-cli-deploy#adapters "ember-cli-deploy adapters"
[4]: https://github.com/achambers/ember-cli-deploy-redis-index-adapter/releases/tag/v0.0.1 "Release v0.0.1"
