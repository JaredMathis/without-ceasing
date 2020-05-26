const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const u = require('wlj-utilities');

u.scope(__filename, context => {
    const except = [
        'node_modules',
        'package.json',
        'package-lock.json',
        'index.js',
    ];
    let directory = './library/';
    const files = fs.readdirSync(directory);
    const filesExcept = u.arrayExcept(files, except);
    const filePaths = filesExcept.map(f => directory + f);
    
    let command = `
    browserify ${filePaths.map(f => '-r ' + f).join(' ')} > public/bundle.js
    `;

    u.merge(context, {command});
    execSync(command);
})
