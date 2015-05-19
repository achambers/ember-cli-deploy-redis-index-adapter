import {
  glob,
  Mocha
} from 'ember-qunit';

var mocha = new Mocha({
  reporter: 'spec'
});

var arg = process.argv[2];
var root = 'tests/';

function addFiles(mocha, files) {
  glob.sync(root + files).forEach(mocha.addFile.bind(mocha));
}

addFiles(mocha, '/**/*-nodetest.js');

if (arg === 'all') {
  addFiles(mocha, '/**/*-nodetest-slow.js');
}

mocha.run(function(failures) {
  process.on('exit', function() {
      process.exit(failures);
    });
});
