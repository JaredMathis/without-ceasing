const fs = require('fs');
const path = require('path');
const u = require('wlj-utilities');

u.scope(__filename, context => {
    u.copyFiles('web', 'public');
});
