const u = require('wlj-utilities');
const letters = require('./letters');
const petitions = require('./petitions');

module.exports = ask;

function ask(request) {
    let result = {};
    u.scope(ask.name, x => {
        u.assert(() => u.isDefined(request));
    
        let letterIndex = letters.indexOf(request.letter);
        u.assert(() => letterIndex >= 0);
        result.letter = letterIndex;

        let petitionIndex = petitions.indexOf(request.petition);
        u.assert(() => petitionIndex >= 0);
        result.petition = petitionIndex;

        u.assert(() => u.isString(request.userId));
        result.userId = request.userId;
    });
    return result;
}