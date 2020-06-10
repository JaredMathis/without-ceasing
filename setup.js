const u = require('wlj-utilities');
const index = require('./index');

u.executeCommand(`node u awsDeployLambda ${index.wcHealth.name}`);
u.executeCommand(`node u awsDeployLambda ${index.wcRequestPrayer.name}`);