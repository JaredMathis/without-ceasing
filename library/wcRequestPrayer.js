
const u = require("wlj-utilities");

module.exports = wcRequestPrayer;

function wcRequestPrayer(event, context, callback) {
    u.awsScope(wcRequestPrayer.name, x => {
        let eventKeys = Object.keys(event);
        let contextKeys = Object.keys(context);
        return {eventKeys,contextKeys,name:event.name};
    }, callback);
}
