const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const { 
    ask,
    prayersAreEqual,
    countries,
} = require('without-ceasing-library');

const u = require('wlj-utilities');

const prayersRoute = 'prayers';
const intercessionsRoute = 'intercessions';

exports.health = functions.https.onRequest(async (req, res) => {
    allowCORS(res);

    res.json({success:true});
});

exports.pray = functions.https.onRequest(async (req, res) => {
    allowCORS(res);

    let userId = req.query.userId;

    let result = ask({
        letter: req.query.letter,
        petition: req.query.petition,
        userId: userId,
    });

    let userPrayers = admin.database().ref(`/user/${userId}/${prayersRoute}`);
    let userPrayersValue = await userPrayers.once('value');

    let allUserPrayers = JSON.parse(JSON.stringify(userPrayersValue));
    if (allUserPrayers) {
        let keys = Object.keys(allUserPrayers);
        for (let key of keys) {
            let prayer = allUserPrayers[key];
            if (prayersAreEqual(result, prayer)) {
                res.json({
                    success:false,
                    message:'Duplicate prayer'
                });
                return;
            }
        }
    }

    let userRequestsChild = await userPrayers.push();
    await userRequestsChild.set(result);

    let prayers = admin.database().ref(`/${prayersRoute}`);
    let prayersChild = await prayers.push();
    await prayersChild.set(result);

    res.json({success:true});
});

exports.intercessions = functions.https.onRequest(async (req, res) => {
    allowCORS(res);

    let prayerUserId;
    u.scope('intercessions validation', x => {
        u.merge(x, {query:req.query});
    
        prayerUserId = req.query.prayerUserId;
        u.assert(() => u.isString(prayerUserId));
    });

    let prayer = {
        letter: req.query.letter,
        petition: req.query.petition,
        userId: prayerUserId,
    };

    let expected = ask(prayer);

    let userPrayers = admin.database().ref(`/user/${prayerUserId}/${prayersRoute}`);
    let userPrayersValue = await userPrayers.once('value');

    let allUserPrayers = clone(userPrayersValue);
    if (!allUserPrayers) {
        res.json({success:false, message:'No prayers for user'});
        return;
    }

    let keys = Object.keys(allUserPrayers);
    let promises = keys.map(key => {
        let result = {};

        let existing = allUserPrayers[key];
        if (prayersAreEqual(expected, existing)) {
            result.prayersAreEqual = true;
            // Loop through intercessions for prayer
            let intercessions = admin.database().ref(`/${intercessionsRoute}/${prayersRoute}/${key}`);
            result.promise = intercessions.once('value')
                .then(v => result.intercessionsOnce = v);
        } else {
            result.promise = new Promise();
        }
        return result; 
    });

    await Promise.all(promises.map(p => p.promise));

    for (let p of promises) {
        if (p.prayersAreEqual) {
            let intercessionsValue = clone(p.intercessionsOnce);
            console.log(intercessionsValue);
            res.json(intercessionsValue);
            return;
        }
    }

    res.json({success:false, message:'did not find intercessions'});
});

function getIntercessions() {
    
}

exports.intercede = functions.https.onRequest(async (req, res) => {
    allowCORS(res);

    let prayerUserId;
    let userId;
    let country;
    u.scope('intercede validation', x => {
        u.merge(x, {query:req.query});

        userId = req.query.userId;
        u.assert(() => u.isString(userId));

        country = req.query.country;
        u.assert(() => u.isString(country));
        u.assert(() => countries.includes(country));
    
        prayerUserId = req.query.prayerUserId;
        u.assert(() => u.isString(prayerUserId));
    });

    let userPrayers = admin.database().ref(`/user/${prayerUserId}/${prayersRoute}`);
    let userPrayersValue = await userPrayers.once('value');

    let allUserPrayers = clone(userPrayersValue);
    if (!allUserPrayers) {
        res.json({success:false, message:'No prayers for user'});
        return;
    }

    let expected = ask({
        letter: req.query.letter,
        petition: req.query.petition,
        userId: prayerUserId,
    });

    let keys = Object.keys(allUserPrayers);
    for (let key of keys) {
        let existing = allUserPrayers[key];
        if (prayersAreEqual(expected, existing)) {
            // Loop through intercessions for prayer
            let intercessions = admin.database().ref(`/${intercessionsRoute}/${prayersRoute}/${key}`);
            let intercessionsOnce = await intercessions.once('value');
            let intercessionsValue = clone(intercessionsOnce);
            console.log({intercessionsValue});
            if (intercessionsValue) {
                for (let keyI in intercessionsValue) {
                    let i = intercessionsValue[keyI];
                    if (i.userId === userId) {
                        res.json({
                            success:true,
                            message:'already interceded',
                        });
                        return;
                    }
                }
            }
            await intercessions.push({
                userId,
                country,
            });
            res.json({
                success:true,
                message:'interceded',
            });
            return;
        }
    }

    res.json({success:false, message:'did not find prayer'});
});

exports.prayers = functions.https.onRequest(async (req, res) => {
    allowCORS(res);
    
    let prayers = admin.database().ref(`/${prayersRoute}`);
    let r = await prayers.once('value');
    res.json(r);
});

function allowCORS(res) {
  res.set('Access-Control-Allow-Origin', "*")
  res.set('Access-Control-Allow-Methods', 'GET, POST')
}

function clone(item) {
    return JSON.parse(JSON.stringify(item))
}