const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const { 
    ask,
    prayersAreEqual,
} = require('without-ceasing-library');

const prayersRoute = 'prayers';

exports.health = functions.https.onRequest(async (req, res) => {
    res.json({success:true});
});

exports.ask = functions.https.onRequest(async (req, res) => {
    let userId = req.query.userId;

    let result = ask({
        letter: req.query.letter,
        petition: req.query.petition,
        userId: userId,
    });

    let userRequests = admin.database().ref(`/user/${userId}/${prayersRoute}`);
    let userRequestsValue = await userRequests.once('value');

    let allUserRequests = JSON.parse(JSON.stringify(userRequestsValue));
    if (allUserRequests) {
        let keys = Object.keys(allUserRequests);
        console.log({allUserRequests});
        for (let key of keys) {
            let prayer = allUserRequests[key];
            if (prayersAreEqual(result, prayer)) {
                res.json({
                    success:false,
                    message:'Duplicate prayer'
                });
                return;
            }
        }
    }

    let userRequestsChild = await userRequests.push();
    await userRequestsChild.set(result);

    let prayers = admin.database().ref(`/${prayersRoute}`);
    let prayersChild = await prayers.push();
    await prayersChild.set(result);

    res.json({success:true});
});

exports.prayers = functions.https.onRequest(async (req, res) => {
    let prayers = admin.database().ref(`/${prayersRoute}`);
    let r = await prayers.once('value');
    res.json(r);
});