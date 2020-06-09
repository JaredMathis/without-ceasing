const { execSync } = require('child_process');

const getWebDirectory = require('./library/getWebDirectory');

require('./build');

const output = execSync(`aws s3 sync ./${getWebDirectory()} s3://without-ceasing-static`);
console.log(output.toString());