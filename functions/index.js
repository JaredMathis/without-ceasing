const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const { ask } = require('without-ceasing-library');

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

    let userRequests = admin.database().ref(`/user/${userId}/requests`);
    let userRequestsChild = await userRequests.push();
    await userRequestsChild.set(result);

    let requests = admin.database().ref('/requests');
    let requestsChild = await requests.push();
    await requestsChild.set(result);

    res.json({success:true});
});

exports.requests = functions.https.onRequest(async (req, res) => {
    let requests = admin.database().ref('/requests');
    let existing = await requests.once('value');
    let value = existing.val();

    res.json({value: value});
});
