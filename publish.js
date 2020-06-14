// Run tests before bumping.
require('./test');

const u = require('wlj-utilities');

u.bumpPackageVersion(__dirname);

u.executeCommand('npm publish');