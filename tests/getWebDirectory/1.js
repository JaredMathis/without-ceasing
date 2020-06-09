
const u = require("wlj-utilities");

const getWebDirectory = require("../../library/getWebDirectory.js");
const index = require("../../index.js");

u.scope(__filename, x => {
    u.assertIsEqualJson(getWebDirectory(), 'docs');
});
