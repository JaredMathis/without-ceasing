
const u = require("wlj-utilities");
const ask = require("../../library/ask.js");

u.scope(__filename, x => {
    let actual;
    let expected;

    let userId = "1234";

    actual = ask({ letter: 'J', petition: 'Wisdom',"userId":userId });
    expected = {"letter":9,"petition":1,"userId":userId};
    u.assertIsEqualJson(() => actual, () => expected);

    actual = ask({ letter: 'B', petition: 'Salvation',"userId":userId });
    expected = {"letter":1,"petition":0,"userId":userId};
    u.assertIsEqualJson(() => actual, () => expected);

    actual = ask({ letter: 'B', petition: 'Patience',"userId":userId });
    expected = {"letter":1,"petition":2,"userId":userId};
    u.assertIsEqualJson(() => actual, () => expected);
});
