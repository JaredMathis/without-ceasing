
const u = require("wlj-utilities");

module.exports = getWebDirectory;

function getWebDirectory() {
    let result;
    u.scope(getWebDirectory.name, x => {
        result = 'docs';
    });
    return result;
}
