const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const u = require('wlj-utilities');

const getWebDirectory = require('./library/getWebDirectory');

u.scope(__filename, context => {
    if (!fs.existsSync(getWebDirectory())) {
        fs.mkdirSync(getWebDirectory());
    }

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
    browserify ${filePaths.map(f => '-r ' + f).join(' ')} > ${getWebDirectory()}/bundle.js
    `;

    u.merge(context, {command});
    execSync(command);
})
