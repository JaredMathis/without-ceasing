
const u = require("wlj-utilities");

module.exports = prayersAreEqual;

function prayersAreEqual(prayerA, prayerB) {
    let result;
    u.scope(prayersAreEqual.name, x => {
        u.merge(x, {prayerA});
        u.merge(x, {prayerB});
        u.assert(() => u.isDefined(prayerA));
        u.assert(() => u.isDefined(prayerB));

        let fields = [
            'userId',
            'petition',
            'letter',
        ];
        result = u.propertiesAreEqual(prayerA, prayerB, fields);
    });
    return result;
}
