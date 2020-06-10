
const u = require("wlj-utilities");

module.exports = wcHealth;

function wcHealth(event, context, callback) {
    u.awsScope(wcHealth.name, x => {
        return "Healthy";
    }, callback);
}
