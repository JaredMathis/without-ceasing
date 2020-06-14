console.log(__filename + " entered");

const fs = require('fs');
const path = require('path');
const u = require('wlj-utilities');
const getWebDirectory = require('./library/getWebDirectory');

require('./browserify');

u.scope(__filename, context => {
    u.copyFiles('web', getWebDirectory());
});
