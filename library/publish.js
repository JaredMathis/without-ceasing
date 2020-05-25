const {
    execSync,
} = require("child_process");

const path = require('path');

// Run tests before bumping.
require('../test');

const u = require('wlj-utilities');

u.bumpPackageVersion(__dirname);

execSync('npm publish');