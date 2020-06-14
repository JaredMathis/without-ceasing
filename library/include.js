// This is so a browserify build picks up these dependencies
// And makes them accessible through the browser.
// Requiring them directly in app.js didn't seem to work.

module.exports['wlj-utilities'] = require('wlj-utilities');
module.exports['without-ceasing-lambda/aws-apigateway.json'] 
    = require('without-ceasing-lambda/aws-apigateway.json');