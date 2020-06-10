
const u = require("wlj-utilities");
const request = require("sync-request");

const wcHealth = require("../../library/wcHealth.js");
const index = require("../../index.js");

u.scope(__filename, x => {
    let apigateway = require("./../../" + u.getAwsApiGatewayFileName());
    let parsed = u.awsLambdaApiCall(apigateway, wcHealth.name);

    u.assertIsEqualJson(parsed, {"success":true,"result":"Healthy"});
});
