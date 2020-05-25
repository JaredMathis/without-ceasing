const request = require('sync-request')
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const u = require('wlj-utilities');

const local = "http://localhost:5001/without-ceasing/us-central1/";
const production = 'https://us-central1-without-ceasing.cloudfunctions.net/';

const server = local;
const health = server + "health";
const requests = server + "requests";

u.scope(__filename, x => {
    if (!isServerRunning()) {
        return;
    }

    test1();
});

function test1() {
    let result;
    u.scope(test1.name, x => {
        let r = request('GET', requests);
        console.log(r.body.toString());
        u.assertIsJsonResponse(r, 200, []);
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