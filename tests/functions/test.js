const request = require('sync-request')
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const u = require('wlj-utilities');

const local = "http://localhost:5001/without-ceasing/us-central1/";
const production = 'https://us-central1-without-ceasing.cloudfunctions.net/';

const server = production;
const healthRoute = server + "health";
const prayersRoute = server + "prayers";
const prayRoute = server + "pray";
const intercedeRoute = server + "intercede";
const intercessionsRoute = server + "intercessions";

u.scope(__filename, x => {
    if (!isServerRunning()) {
        return;
    }

    ask2PrayersShouldShowUp();
    intercedeForPrayer();
});

function askPrayer(letter, petition, userId) {
    u.scope(askPrayer.name, x => {
        let r = request('GET', prayRoute + u.toQueryString({letter,petition,userId}));
        let rBody = r.body.toString();
        u.merge(x,{rBody});

        let body = JSON.parse(r.body);
        u.merge(x,{body});
        u.assert(() => u.isDefined(body.success));
        u.assert(() => body.success === true || body.message === 'Duplicate prayer');
    });
}

function intercede(letter, petition, prayerUserId,userId,country) {
    u.scope(intercede.name, x => {
        let qso = {letter,petition,prayerUserId,userId,country};
        let qs = u.toQueryString(qso);
        u.merge(x, {qs});
        let route = intercedeRoute + qs;
        u.merge(x, {route});
        let r = request('GET',route );
        let rBody = r.body.toString();
        u.merge(x,{rBody});

        let body = JSON.parse(r.body);
        u.merge(x,{body});
        u.assert(() => u.isDefined(body.success));
        u.assert(() => body.success === true);
        u.assert(() => ['interceded', 'already interceded'].includes(body.message));
    });
}

function ask2PrayersShouldShowUp() {
    let result;
    u.scope(ask2PrayersShouldShowUp.name, x => {
        askPrayer('J', 'Wisdom', '1234');
        askPrayer('J', 'Wisdom', '1235');

        assertTotalPrayersAtLeast(2);
    });
    return result;
}

function assertTotalPrayersAtLeast(prayerCount) {
    u.scope(assertTotalPrayersAtLeast.name, x => {
        u.merge(x, {step:'making request'});
        let r = request('GET', prayersRoute);
    
        u.merge(x, {step:'parsing'});
        let body = JSON.parse(r.body.toString());
    
        u.merge(x, {step:'getting keys'});
        u.merge(x, {body});
        let keys = Object.keys(body);
    
        u.merge(x, {keys});
        u.assert(() => keys.length >= prayerCount);
    })
}

function intercedeForPrayer() {
    let result;
    u.scope(intercedeForPrayer.name, x => {
        intercede('J', 'Wisdom', '1234', '1236', 'United States');
        intercede('J', 'Wisdom', '1234', '1237', 'Mexico');
        intercede('J', 'Wisdom', '1234', '1238', 'Mexico');

        assertTotalIntercessionsAtLeast('J', 'Wisdom', '1234', 3);
    });
    return result;

}

function assertTotalIntercessionsAtLeast(letter, petition, userId, intercessionCount) {
    u.scope(assertTotalIntercessionsAtLeast.name, x => {
        u.merge(x, {step:'making request'});
        let r = request('GET', intercessionsRoute + u.toQueryString({letter,petition,prayerUserId:userId}));
    
        u.merge(x, {step:'parsing'});
        let json = r.body.toString();
        u.merge(x, {json});
        let body = JSON.parse(json);

        u.merge(x, {step:'getting keys'});
        u.merge(x, {body});
        let keys = Object.keys(body);
    
        u.merge(x, {keys});
        u.assert(() => keys.length === intercessionCount);
    })
}

function isServerRunning() {
    let result;
    u.scope(isServerRunning.name, x => {
        let h;
        try {
            h = request('GET', healthRoute);
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