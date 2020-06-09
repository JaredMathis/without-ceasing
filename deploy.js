const u = require('wlj-utilities');

const getWebDirectory = require('./library/getWebDirectory');

require('./build');

const command = `aws s3 sync ./${getWebDirectory()} s3://without-ceasing-static`;
const output = u.executeCommand(command);
console.log(output);