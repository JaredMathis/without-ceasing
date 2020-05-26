const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const { 
    ask,
    prayersAreEqual,
} = require('without-ceasing-library');

const prayersRoute = 'prayers';

exports.health = functions.https.onRequest(async (req, res) => {
    allowCORS(res);

    res.json({success:true});
});

exports.ask = functions.https.onRequest(async (req, res) => {
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