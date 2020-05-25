const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const u = require('wlj-utilities');

u.scope(__filename, context => {
    let directory = './library/';
    const files = fs.readdirSync(directory);
    const filePaths = files.map(f => directory + f);
    
    let command = `
    browserify ${filePaths.map(f => '-r ' + f).join(' ')} > public/bundle.js
    `;

    u.merge(context, {command});
    execSync(command);
})
