var { 
    execSync
} = require('child_process');

require('./test');

const command = 'firebase deploy';
console.log('Running: ' + command);
let result = execSync(command);
console.log('Completed running: ' + command);
console.log(result.toString());