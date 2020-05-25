const {
    execSync,
} = require("child_process");

// Run tests before bumping.
require('../test');

const u = require('wlj-utilities');

u.bumpPackageVersion();

execSync('npm publish without-ceasing-library');