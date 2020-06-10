
const u = require("wlj-utilities");

module.exports = getNames;

function getNames() {
    let result;
    u.scope(getNames.name, x => {
        module.exports = [
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
            'K',
            'L',
            'M',
            'N',
            'O',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
        ];
    });
    return result;
}
