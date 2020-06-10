
const u = require("wlj-utilities");

const wcRequestPrayer = require("../../library/wcRequestPrayer.js");
const index = require("../../index.js");

u.scope(__filename, x => {
    let apigateway = require("./../../" + u.getAwsApiGatewayFileName());
    let parsed = u.awsLambdaApiCall(apigateway, wcRequestPrayer.name, { 
        name: "Jared" 
    });

    u.assertIsEqualJson(parsed, {"success":true,"result":"Healthy"});
});
