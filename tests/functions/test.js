const request = require('sync-request')
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const u = require('wlj-utilities');

const local = "http://localhost:5001/without-ceasing/us-central1/";
const production = 'https://us-central1-without-ceasing.cloudfunctions.net/';

const server = local;
const health = server + "health";
const requests = server + "requests";
const ask = server + "ask";

u.scope(__filename, x => {
    if (!isServerRunning()) {
        return;
    }

    test1();
});

function askPrayer(letter, petition, userId) {
    u.scope(askPrayer.name, x => {
        let r = request('GET', ask + u.toQueryString({letter,petition,userId}));
        let rBody = r.body.toString();
        u.merge(x,{rBody});

        let body = JSON.parse(r.body);
        u.merge(x,{body});
        u.assert(() => u.isDefined(body.success));
        u.assert(() => body.success === true || body.message === 'Duplicate prayer');
    });
}

function test1() {
    let result;
    u.scope(test1.name, x => {
        askPrayer('J', 'Wisdom', '1234');
        askPrayer('J', 'Wisdom', '1235');

        u.merge(x, {step:'making request'});
        let r = request('GET', requests);

        u.merge(x, {step:'parsing'});
        let body = JSON.parse(r.body.toString());

        u.merge(x, {step:'getting keys'});
        u.merge(x, {body});
        let keys = Object.keys(body);

        u.merge(x, {keys});
        u.assert(() => keys.length === 2);
    });
    return result;
}

function isServerRunning() {
    let result;
    u.scope(isServerRunning.name, x => {
        let h;
        try {
            h = request('GET', health);
        } catch (e) {
            if (e.message === "connect ECONNREFUSED 127.0.0.1:5001") {
                console.log('Emulator is not running.');
                console.log('Run: firebase emulators:start');
            } else {
                console.log(e);
            }
            result = false;
            return;
        }
        u.assertIsJsonResponse(h, 200, {success:true});
        result = true;
    });
    return result;
}