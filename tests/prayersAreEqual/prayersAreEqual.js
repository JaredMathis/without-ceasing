
const u = require("wlj-utilities");

const prayersAreEqual = require("../../library/prayersAreEqual.js");

u.scope(__filename, x => {
    u.assert(() => prayersAreEqual({
        userId: '1234',
        letter: 'J',
        petition: 'Wisdom',
    }, {
        userId: '1234',
        letter: 'J',
        petition: 'Wisdom',
    }));
    // Different user Ids
    u.assert(() => !prayersAreEqual({
        userId: '1235',
        letter: 'J',
        petition: 'Wisdom',
    }, {
        userId: '1234',
        letter: 'J',
        petition: 'Wisdom',
    }));
    // Different letters
    u.assert(() => !prayersAreEqual({
        userId: '1234',
        letter: 'K',
        petition: 'Wisdom',
    }, {
        userId: '1234',
        letter: 'J',
        petition: 'Wisdom',
    }));
    // Different petitions
    u.assert(() => !prayersAreEqual({
        userId: '1234',
        letter: 'J',
        petition: 'Wisdom',
    }, {
        userId: '1234',
        letter: 'J',
        petition: 'Salvation',
    }));
});
