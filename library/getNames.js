
const u = require("wlj-utilities");

module.exports = getNames;

let letters = require('./letters');
let names = letters;

function getNames() {
    let result;
    u.scope(getNames.name, x => {
        result = names
    });
    return result;
}