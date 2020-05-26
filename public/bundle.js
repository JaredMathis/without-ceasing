require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const core = require('./core');
const log = require('./log');
const assert = require('./assert');
const file = require('./file');
const tools = require('./tools');
const commandLine = require('./commandLine');
const index = require('./index');

module.exports = {};
index.merge(module.exports, core);
index.merge(module.exports, log);
index.merge(module.exports, assert);
index.merge(module.exports, file);
index.merge(module.exports, tools);
index.merge(module.exports, commandLine);
index.merge(module.exports, index);
},{"./assert":2,"./commandLine":3,"./core":4,"./file":5,"./index":6,"./log":19,"./tools":20}],2:[function(require,module,exports){
const scope = require('./library/scope');
const isUndefined = require('./library/isUndefined');
const merge = require('./library/merge');
const assert = require('./library/assert');

const {
    consoleLog,
    logProperties,
} = require('./log');

const {
    isDefined,
    processExit,
    isInteger,
    isFunction,
} = require('./core');

const fs = require('fs');

module.exports = {
    assertFileExists,
    assertAtLeast,
    assertAtMost,
    assertIsEqual,
    assertIsDefined,
    assertIsEqualJson,
};

function assertError(name) {
    throw new Error('Assert error: ' + name);
}

function fileExists(fileName) {
    return fs.existsSync(fileName);
}

function assertFileExists(fileName) {
    return scope(assertFileExists.name, context => {
        merge(context, {fileName});
        assert(fileExists(fileName));
    });
}

function assertIsDefined(a) {
    return scope(assertIsDefined.name, context => {
        merge(context, {a});
        return assert(isDefined(a));
    });
}

function assertIsEqual(left, right) {
    return scope(assertIsEqual.name, context => {
        merge(context, {left});
        assertIsDefined(left);

        merge(context, {right});
        assertIsDefined(right);

        let leftValue;
        if (isFunction(left)) {
            leftValue = left();
        } else {
            leftValue = left;
        }
        merge(context, {leftValue});
        let rightValue;
        if (isFunction(right)) {
            rightValue = right();
        } else {
            rightValue = right;
        }
        merge(context, {rightValue});

        let equals = leftValue === rightValue;
        if (equals) {
            return;
        }
        return assertError(assertIsEqual.name);
    });
}

function assertIsEqualJson(left, right) {
    return scope(assertIsEqualJson.name, context => {
        merge(context, {left});
        merge(context, {right});

        assertIsDefined(left);
        assertIsDefined(right);

        let leftValue;
        if (isFunction(left)) {
            leftValue = left();
        } else {
            leftValue = left;
        }
        merge(context, {leftValue});
        let rightValue;
        if (isFunction(right)) {
            rightValue = right();
        } else {
            rightValue = right;
        }
        merge(context, {rightValue});

        let equals = JSON.stringify(leftValue) === JSON.stringify(rightValue);
        if (equals) {
            return;
        }
        return assertError(assertIsEqualJson.name);
    });
}

function assertAtLeast(left, right) {
    return scope(assertAtLeast.name, context => {
        merge(context, {left});
        merge(context, {right});

        assert(isInteger(left));
        assert(isInteger(right));

        let atLeast = left >= right;
        if (atLeast) {
            return;
        }
        return assertError(assertAtLeast.name);
    });
}

function assertAtMost(left, right) {
    return scope(assertAtMost.name, context => {
        merge(context, {left});
        merge(context, {right});

        assert(isInteger(left));
        assert(isInteger(right));

        let atMost = left <= right;
        if (atMost) {
            return;
        }
        return assertError(assertAtMost.name);
    });
}
},{"./core":4,"./library/assert":7,"./library/isUndefined":12,"./library/merge":13,"./library/scope":16,"./log":19,"fs":46}],3:[function(require,module,exports){
(function (process){
const { 
    isArray,
    isString,
} = require('./core');

const scope = require('./library/scope');
const assert = require('./library/assert');
const merge = require('./library/merge');

const { 
    loop,
} = require('./tools');

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');

let verbose = false;

module.exports = {
    commandLine,
    fn,
    baseDirectory: '.',
    /** Whether or not this is the wlj-utilities NPM package */
    isWljUtilitiesPackage: false
};

function commandLine() {
    scope(commandLine.name, x=> {
        let commands = {
            fn,
        };

        let command = commands[process.argv[2]];
        if (!command) {
            console.log('Please use a command-line argument.');
            console.log('Valid command-line arguments:');
            loop(Object.keys(commands), c => {
                console.log(c);
            });
            return;
        }
        
        let remaining = process.argv.slice(3);
        if (verbose) {
            console.log('Calling: ' + command.name);
            console.log('Args: ' + remaining);
        }
        let result = command(remaining);
        console.log(result);
    
    });
}

function fn(args) {
    let result = [];
    scope(fn.name, x => {
        merge(x, {args});
        assert(() => isArray(args));

        if (args.length !== 1) {
            result.push('Expecting 1 argument');
            return;
        }

        let fnName = args[0];
        assert(() => isString(fnName));

        const library = 'library';
        let libDirectory = path.join(module.exports.baseDirectory, library);
        if (!fs.existsSync(libDirectory)) {
            fs.mkdirSync(libDirectory);
            result.push('Created ' + libDirectory);
        }

        let fnFile = path.join(libDirectory, fnName + '.js');
        assert(() => !fs.existsSync(fnFile));
        fs.writeFileSync(fnFile, `
${module.exports.isWljUtilitiesPackage ? 'const scope = require("./scope");' : 'const u = require("wlj-utilities");' }

module.exports = ${fnName};

function ${fnName}() {
    let result;
    ${module.exports.isWljUtilitiesPackage ? '' : 'u.'}scope(${fnName}.name, x => {

    });
    return result;
}
`);
        assert(() => fs.existsSync(fnFile));
        result.push('Created ' + fnFile);

        let testsDirectory = path.join(module.exports.baseDirectory, 'tests');
        if (!fs.existsSync(testsDirectory)) {
            fs.mkdirSync(testsDirectory);
            result.push('Created ' + testsDirectory);
        }

        let fnTestDirectory = path.join(testsDirectory, fnName);
        if (!fs.existsSync(fnTestDirectory)) {
            fs.mkdirSync(fnTestDirectory);
            result.push('Created ' + fnTestDirectory);
        }

        let testFile = path.join(fnTestDirectory, fnName + '.js');
        assert(() => !fs.existsSync(testFile));
        fs.writeFileSync(testFile, `
const u = require("${module.exports.isWljUtilitiesPackage ? '../../all' : 'wlj-utilities' }");

const ${fnName} = require("../../${library}/${fnName}.js");

u.scope(__filename, x => {

});
`);
        assert(() => fs.existsSync(testFile));
        result.push('Created ' + testFile);

        let allTestsFile = path.join(module.exports.baseDirectory, 'test.js');
        if (!fs.existsSync(allTestsFile)) {
            fs.writeFileSync(allTestsFile, '');
            result.push('Created ' + allTestsFile);
        } else {
            result.push('Modified ' + allTestsFile);
        }
        fs.appendFileSync(allTestsFile, EOL);
        fs.appendFileSync(allTestsFile, `require("./${testFile}");`)

        let indexFile = path.join(module.exports.baseDirectory, 'index.js');
        if (!fs.existsSync(indexFile)) {
            fs.writeFileSync(indexFile, 'module.exports = {};');
            result.push('Created ' + indexFile);
        } else {
            result.push('Modified ' + indexFile);
        }
        fs.appendFileSync(indexFile, EOL);
        fs.appendFileSync(indexFile, `module.exports.${fnName} = require("./library/${fnName}.js");`);
        result.push('Finished');
    });

    return result.join(EOL);
}
}).call(this,require('_process'))
},{"./core":4,"./library/assert":7,"./library/merge":13,"./library/scope":16,"./tools":20,"_process":49,"fs":46,"os":47,"path":48}],4:[function(require,module,exports){
(function (process){
const isUndefined = require('./library/isUndefined');

module.exports = {
    processExit,
    isEqualJson,
    isArray,
    isDefined,
    isInteger,
    range,
    isFunction,
    isString,
}

function isArray(a) {
    return Array.isArray(a);
}

function isString(s) {
    return (s + "") === s;
}

function processExit() {
    let log = true;
    if (log) {
        let stack = new Error().stack;
        console.log(stack);
    }
    console.log('Calling process.exit(1)');
    process.exit(1);
}

function isEqualJson(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function isDefined(a) {
    return !isUndefined(a);
}

function isInteger(a) {
    return parseInt(a, 10) === a;
}

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function range(count, start) {
    if (isUndefined(start)) {
        start = 0;
    }
    let result = [];
    let max = start + count - 1;
    for (let i = start; i <= max; i++) {
        result.push(i);
    }
    return result;
}
}).call(this,require('_process'))
},{"./library/isUndefined":12,"_process":49}],5:[function(require,module,exports){
const {
    isDefined,
    isString,
} = require('./core');

const scope = require('./library/scope');
const isUndefined = require('./library/isUndefined');

const merge = require('./library/merge');
const assert = require('./library/assert');

const {
    assertFileExists,
    assertIsEqual,
} = require('./assert');

const {
    loop,
} = require('./tools');

const fs = require('fs');
const path = require('path');

module.exports = {
    readFile,
    getFiles,
    appendFileLine,
    copyFiles,
    deleteDirectory,
    getPackageVersion,
    bumpPackageVersion,
}

function readFile(fileName) {
    return scope(readFile.name, context => {
        assertFileExists(fileName);

        merge(context, {fileName});
        let file = fs.readFileSync(fileName, 'utf8');
        return file;
    });
}

function getFiles(directoryName) {
    return scope(getFiles.name, context => {
        assertFileExists(directoryName);

        merge(context, {directoryName});
        let result = fs.readdirSync(directoryName);
        return result;
    });
}

function appendFileLine(file, line) {
    scope(appendFileLine.name, context => {
        assertFileExists(file);
        if (isDefined(line)) {
            assert(() => isString(line));
            if (line.length > 0) {
                fs.appendFileSync(file, line);
            }
        }
        fs.appendFileSync(file, `
`);
    });
}

function copyFiles(fromDirectory, toDirectory) {
    scope(copyFiles.name, context => {
        const fileNames = fs.readdirSync(fromDirectory);
    
        // Create the directory if it doesn't exist.
        if (!fs.existsSync(toDirectory)) {
            fs.mkdirSync(toDirectory);
        }

        loop(fileNames, fileName => {
            let src = path.join(fromDirectory, fileName);
            let dest = path.join(toDirectory, fileName);
            fs.copyFileSync(src, dest);
        });
    })
}

function deleteDirectory(directory) {
    scope(deleteDirectory.name, context => {
        const fileNames = fs.readdirSync(directory);

        loop(fileNames, fileName => {
            let p = path.join(directory, fileName);
            fs.unlinkSync(p);
        });

        fs.rmdirSync(directory);
    });
}

const packageJson = 'package.json';

function getPackageVersion(packageDirectory) {
    let version;
    scope(getPackageVersion.name, x => {
        assert(() => isString(packageDirectory));
        let packagePath = path.join(packageDirectory, packageJson);

        let package = require(packagePath);

        version = package.version;
        merge(x, {version});
        assert(() => isDefined(version));
    })
    return version;
}

function bumpPackageVersion(packageDirectory) {
    let log = true;
    scope(bumpPackageVersion.name, x => {
        assert(() => isString(packageDirectory));
        let version = getPackageVersion(packageDirectory);
        merge(x, {version});

        let parts = version.split('.');
        assertIsEqual(() => parts.length, 3);

        let build = parseInt(parts[2]);
        let nextBuild = build + 1;

        parts[2] = nextBuild;

        let nextVersion = parts.join('.');

        let packagePath = path.join(packageDirectory, packageJson);

        let package = require(packagePath);
        package.version = nextVersion;

        let json = JSON.stringify(package, null, 2);
        fs.writeFileSync(packagePath, json);
        if (log) console.log(`Updated version to ${nextVersion} in ` + packagePath);
    })
}
},{"./assert":2,"./core":4,"./library/assert":7,"./library/isUndefined":12,"./library/merge":13,"./library/scope":16,"./tools":20,"fs":46,"path":48}],6:[function(require,module,exports){
module.exports = {};
module.exports.throws = require("./library/throws.js");
module.exports.assertIsJsonResponse = require("./library/assertIsJsonResponse.js");
module.exports.assertIsEqualJson = require("./library/assertIsEqualJson.js");
module.exports.assert = require("./library/assert.js");
module.exports.scope = require("./library/scope.js");
module.exports.propertiesToString = require("./library/propertiesToString.js");
module.exports.toQueryString = require("./library/toQueryString.js");
module.exports.propertiesAreEqual = require("./library/propertiesAreEqual.js");
module.exports.assertIsStringArray = require("./library/assertIsStringArray.js");
module.exports.assertOnlyContainsProperties = require("./library/assertOnlyContainsProperties.js");
module.exports.merge = require("./library/merge.js");
},{"./library/assert.js":7,"./library/assertIsEqualJson.js":8,"./library/assertIsJsonResponse.js":9,"./library/assertIsStringArray.js":10,"./library/assertOnlyContainsProperties.js":11,"./library/merge.js":13,"./library/propertiesAreEqual.js":14,"./library/propertiesToString.js":15,"./library/scope.js":16,"./library/throws.js":17,"./library/toQueryString.js":18}],7:[function(require,module,exports){

const scope = require("./scope");
const merge = require("./merge");
const isFunction = require("../core").isFunction;

module.exports = assert;

function assert(b) {
    let result;
    scope(assert.name, x => {
        merge(x, {b});

        let bValue;
        if (isFunction(b)) {
            bValue = b();
        } else {
            bValue = b;
        }
        merge(x, {bValue});

        if (bValue) {
            return;
        }

        throw new Error('assert failed');
    });
    return result;
}

},{"../core":4,"./merge":13,"./scope":16}],8:[function(require,module,exports){
const assert = require("./assert");
const scope = require('./scope');
const isDefined = require("../core").isDefined;
const isFunction = require("../core").isFunction;
const merge = require("./merge");

module.exports = assertIsEqualJson;

function assertIsEqualJson(left, right) {
    let result;
    scope(assertIsEqualJson.name, x => {
        merge(x, {left});
        merge(x, {right});
        assert(() => isDefined(left));
        assert(() => isDefined(right));

        let leftValue;
        if (isFunction(left)) {
            leftValue = left();
        } else {
            leftValue = left;
        }
        merge(x, {leftValue});

        let rightValue;
        if (isFunction(right)) {
            rightValue = right();
        } else {
            rightValue = right;
        }
        merge(x, {rightValue});

        assert(() => JSON.stringify(leftValue) === JSON.stringify(rightValue));
    });
    return result;
}

},{"../core":4,"./assert":7,"./merge":13,"./scope":16}],9:[function(require,module,exports){
const scope = require("./scope");
const assert = require("./assert");
const merge = require("./merge");
const isDefined = require("./../core").isDefined;
const isFunction = require("./../core").isFunction;
const isInteger = require("./../core").isInteger;

module.exports = assertIsJsonResponse;

function assertIsJsonResponse(response, status, body) {
    let result;
    scope(assertIsJsonResponse.name, x => {
        merge(x, {response});
        merge(x, {status});
        merge(x, {body});

        assert(() => isDefined(response));
        assert(() => isInteger(status));
        assert(() => isDefined(body));
        
        assert(() => response.statusCode === status);
        assert(() => isDefined(response.body));
        assert(() => isFunction(response.body.toString));

        let actualJson = response.body.toString();
        merge(x, {actualJson});

        let expectedJson = JSON.stringify(body);
        merge(x, {expectedJson});

        assert(() => actualJson === expectedJson);
    });
    return result;
}

},{"./../core":4,"./assert":7,"./merge":13,"./scope":16}],10:[function(require,module,exports){

const assert = require("./assert");
const scope = require("./scope");
const isArray = require("./../core").isArray;
const isString = require("./../core").isString;

module.exports = assertIsStringArray;

function assertIsStringArray(array) {
    let result;
    scope(assertIsStringArray.name, x => {
        assert(() => isArray(array));

        for (let a of array) {
            assert(() => isString(a));
        }
    });
    return result;
}

},{"./../core":4,"./assert":7,"./scope":16}],11:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const merge = require("./merge");
const assertIsStringArray = require("./assertIsStringArray");
const isDefined = require("./../core").isDefined;

module.exports = assertOnlyContainsProperties;

function assertOnlyContainsProperties(object, properties) {
    let result;
    scope(assertOnlyContainsProperties.name, x => {
        merge(x, {object});
        merge(x, {properties});
        
        assert(() => isDefined(object));
        assertIsStringArray(properties);

        for (let key in object) {
            assert(() => properties.includes(key));
        }

        for (let property of properties) {
            assert(() => object.hasOwnProperty(property));
        }
    });
    return result;
}

},{"./../core":4,"./assert":7,"./assertIsStringArray":10,"./merge":13,"./scope":16}],12:[function(require,module,exports){
module.exports = isUndefined;

function isUndefined(a) {
    return typeof a === 'undefined';
}
},{}],13:[function(require,module,exports){

const scope = require("./scope");
const isUndefined = require('./isUndefined')

module.exports = merge;

/**
 * Does something special with undefined.
 * @param {*} a 
 * @param {*} b 
 */
function merge(a, b) {
    if (isUndefined(a)) {
        throw new Error('merge received undefined first argument');
    }
    if (isUndefined(b)) {
        throw new Error('merge received undefined second argument');
    }
    for (let key in b) {
        a[key] = b[key];
        if (isUndefined(a[key])) {
            a[key] = '[undefined]';
        }
    }
}

},{"./isUndefined":12,"./scope":16}],14:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const assertOnlyContainsProperties = require("./assertOnlyContainsProperties");
const assertIsStringArray = require("./assertIsStringArray");

module.exports = propertiesAreEqual;

function propertiesAreEqual(a, b, properties) {
    let result;
    scope(propertiesAreEqual.name, x => {

        assertIsStringArray(properties);

        assertOnlyContainsProperties(a, properties);
        assertOnlyContainsProperties(b, properties);

        result = true;
        for (let property in a) {
            let equal = a[property] === b[property];
            if (!equal) {
                result = false;
                return;
            }
        }
        
    });
    return result;
}

},{"./assert":7,"./assertIsStringArray":10,"./assertOnlyContainsProperties":11,"./scope":16}],15:[function(require,module,exports){
const isFunction = require('./../core').isFunction;
const isUndefined = require('./isUndefined');
const truncateStringTo = require('./../log').truncateStringTo;

module.exports = propertiesToString;

function propertiesToString(object, prefix) {
    if (isUndefined(prefix)) {
        prefix = '';
    }

    let result;

    result = [];

    const maxCharacters = 120;
    for (let property in object) {
        let o = {};
        o[property] = object[property];

        if (isFunction(o[property])) {
            o[property] = o[property].toString();
        }

        let json = JSON.stringify(o);
        let trimmed = truncateStringTo(json, maxCharacters);

        result.push(prefix + trimmed);
    }
    return result;
}

},{"./../core":4,"./../log":19,"./isUndefined":12}],16:[function(require,module,exports){
const isString = require("../core").isString;
const isFunction = require("../core").isFunction;
const processExit = require("../core").processExit;
const propertiesToString = require("./propertiesToString");

module.exports = scope;

let count = 0;

function scope(name, lambda) {
    count++;

    let result;
    
    if (!isString(name)) {
        error(scope.name, 'Expecting name to be string');
    }
    if (!isFunction(lambda)) {
        error(scope.name, 'Expecting lambda to be function');
    }

    const x = {};
    try {
        result = lambda(x);
    } catch (e) {
        count--;

        if (count === 0) {
            let indent = '  ';
            console.log(name + ' entered');
            let properties = propertiesToString(x, indent);
            for (let p of properties) {
                console.log(p);
            }

            let current = e;
            while ((current instanceof ScopeError)) {
                console.log(indent + current.name + ' entered');
                indent += '  '
                let properties = propertiesToString(current.context, indent);
                for (let p of properties) {
                    console.log(p);
                }
                current = current.innerError;
            }

            console.log(e);
            processExit();
        } else {
            throw new ScopeError(name, x, e);
        }
    }

    count--;

    return result;
}

function error(name, message) {
    throw new Error(`Error: ${name}: ${message}`)
}

function ScopeError(name, context, innerError) {
    this.name = name;
    this.context = context;
    this.innerError = innerError;
}

//ScopeError.prototype = new Error();
},{"../core":4,"./propertiesToString":15}],17:[function(require,module,exports){
const {
    isFunction,
} = require("./../core");

const scope = require("./../library/scope");
const assert = require("./../library/assert");

module.exports = throws;

function throws(lambda) {
    let result;
    scope(throws.name, x => {
        assert(() => isFunction(lambda));
        try {
            lambda();
            result = false;
            return;
        } catch (e) {
            result = true;
            return;
        }
    });
    return result;
}

},{"./../core":4,"./../library/assert":7,"./../library/scope":16}],18:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const merge = require("./merge");
const isDefined = require("./../core").isDefined;
const isString = require("./../core").isString;

module.exports = toQueryString;

function toQueryString(object) {
    let result;
    scope(toQueryString.name, x => {
        merge(x, {object});
        assert(() => isDefined(object));

        result = '';
        let first = true;
        for (let key in object) {
            merge(x, {key});
            if (first) {
                result += "?";
                first = false;
            } else {
                result += '&';
            }
            result += key;
            let value = object[key];
            merge(x, {value});
            assert(() => isString(value));
            result += '=';
            result += value;
        }
    });
    return result;
}

},{"./../core":4,"./assert":7,"./merge":13,"./scope":16}],19:[function(require,module,exports){
const {
    processExit,
    isUndefined,
    isFunction,
} = require('./core');

module.exports = {
    consoleLog,
    logProperties,
    truncateStringTo,
}

// TODO: Validate arguments of framework

let indent = 0;

let context = {};

function isString(o) {
    return o.toString() === o;
}

function getPrefix(offset) {
    offset = offset || 0;

    let tab = "  ";
    let prefix = "";
    for (let i = 0; i < indent - offset; i++) {
        prefix += tab;
    }
    return prefix;
}

function truncateStringTo(string, maxCharacters) {
    let ellipses = "...";
    if (string.length > maxCharacters) {
        string = string.substring(0, maxCharacters - ellipses.length);
        string += ellipses;
    }
    return string;
}

/**
 * Does something special if the property name is "parent".
 */
function logProperties(object, offset) {
    offset = offset || 0;
    let parent = '$parent';
    let name = '$name';

    let log = false;
    if (log) console.log('logProperties entered', {object});

    let prefix = getPrefix(offset);

    if (object.hasOwnProperty(parent)) {
        logProperties(object[parent], offset + 1);
    }

    if (object.hasOwnProperty(name)) {
        console.log(getPrefix(offset + 1) + object[name] + ' entered');
    }

    const maxCharacters = 120;
    for (let property in object) {
        if (log) console.log('logProperties', {property});
        if ([parent, name].includes(property)) {
            continue;
        }

        let o = {};
        o[property] = object[property];

        if (isFunction(o[property])) {
            o[property] = o[property].toString();
        }

        let json = JSON.stringify(o);
        if (log) console.log('logProperties', {json});
        if (log) console.log('logProperties', {keys:Object.keys(o)});

        let trimmed = truncateStringTo(json, maxCharacters);
        console.log(prefix + trimmed);
    }    
}

function scope(name, lambda) {
    let log = false;
    if (log) console.log('scope entered');
    if (log) consoleLog(name + " entered");

    let result;

    indent++;
    let oldContext = context;
    newContext = {};
    newContext.$name = name; 
    newContext.$parent = oldContext;
    context = newContext;
    try {
        result = lambda(context);
    } catch (e) {
        console.log('scope error');
        logProperties(context);
        console.log(e);
        processExit();
    }
    context = oldContext;
    indent--;

    if (log) consoleLog(name + " leaving");

    return result;
}

function consoleLog(message) {
    let log = false;
    let verbose = false;
    if (log) console.log('consoleLog entered');

    if (indent < 0) {
        if (verbose)
        if (log) console.log('indent negative');
        console.log('consoleLog error');
        console.log('need to call consoleLog inside scope');
        processExit();
    } else {
        if (verbose)
        if (log) console.log('indent not negative');
    }

    if (isString(message)) {
        if (verbose)
        if (log) console.log('message is string');
        let prefix = getPrefix();
        if (log) prefix = "message: " + prefix;
        console.log(prefix + message);

    } else {
        if (log) console.log('message is not string');
        logProperties(message);
    }

    if (log) console.log('consoleLog leaving');
}
},{"./core":4}],20:[function(require,module,exports){
const isUndefined = require('./library/isUndefined');
const merge = require('./library/merge');
const assert = require('./library/assert');

const {
    isArray,
    isFunction,
    isDefined,
    isString,
    isInteger,
} = require('./core');

const scope = require('./library/scope');

const {
    consoleLog,
} = require('./log');

module.exports = {
    loop,
    toDictionary,
    isArrayIndex,
    arrayLast,
    arrayAll,
    arraySome,
    isDistinct,
    loopPairs,
    arrayMax,
    arrayMin,
    arrayCount,
    arrayMin,
    stringSuffix,
};

/**
 * Return true to break out of loop.
 */
function loop(array, lambda) {
    let log = false;
    scope(loop.name, context => {
        merge(context, {array});
        merge(context, {lambda});

        assert(() => isArray(array));
        assert(() => isFunction(lambda));
    
        for (let index = 0; index < array.length; index++) {
            merge(context, {index});
            let element = array[index];
            merge(context, {element});
            let breakLoop = lambda(element, index);
            if (breakLoop) {
                break;
            }
        }
    })
}

function toDictionary(array, property) {
    let result = {};

    scope(toDictionary.name, context => {
    
        loop(array, a => {
            let key = a[property];
            merge(context, {key});
            assert(() => isDefined(key));
    
            if (result[key]) {
                throw new Error('Duplicate key');
            }
            result[key] = a; 
        });
    })

    return result;
}

function isArrayIndex(array, index) {
    let result;
    scope(isArrayIndex.name, x => {
        merge(x,{array});
        merge(x,{index});
        let ia = isArray(array);
        merge(x,{ia});
        let is = isString(array);
        merge(x,{is});
        assert(() => ia || is);
        let ii = isInteger(index);
        merge(x,{ii});
        assert(() => ii);
        let lower = 0 <= index;
        let upper = index < array.length;
        merge(x,{lower});
        merge(x,{upper});
        result = lower && upper;
    });
    return result;
}

function arrayLast(array) {
    assert(() => isArray(array) || isString(array));
    return array[array.length - 1];
}
function arrayMax(array) {
    let max;

    scope(arrayAll.name, context => {
        assert(() => isArray(array));
        
        max = array[0]

        loop(array, a => {
            if (a > max) {
                max = a;
            }
        })
    });

    return max;
}
function arrayMin(array) {
    let min;

    scope(arrayAll.name, context => {
        assert(() => isArray(array));
        
        min = array[0]

        loop(array, a => {
            if (a < min) {
                min = a;
            }
        })
    });

    return min;
}

/**
 * Returns true if array is empty
 * or if predicate is true for each element
 * of the array
 * @param {*} array 
 * @param {*} predicate 
 */
function arrayAll(array, predicate) {
    let success = true;

    scope(arrayAll.name, context => {
        assert(() => isArray(array));

        loop(array, a => {
            if (!predicate(a)) {
                success = false;
                return true;
            }
        })
    });

    return success;
}

/**
 * Returns false if array is empty
 * or if predicate is true for some element
 * of the array
 * @param {*} array 
 * @param {*} predicate 
 */
function arraySome(array, predicate) {
    let success = false;

    scope(arraySome.name, context => {
        assert(() => isArray(array));

        loop(array, a => {
            if (predicate(a)) {
                success = true;
                return true;
            }
        })
    });

    return success;
}

function loopPairs(array, lambda) {
    scope(loopPairs.name, context => {
        loop(array, (a, i) => {
            let result;
            loop(array, (b, j) => {
                if (j <= i) {
                    return;
                }
    
                result = lambda(a, b);
                if (result) {
                    return true;
                }
            });
            if (result) {
                return true;
            }
        });
    });
}

function isDistinct(array) {
    let success = true;

    scope(isDistinct.name, context => {
        assert(() => isArray(array));

        loopPairs(array, (a, b) => {
            if (a === b) {
                success = false;
            }
        });
    });

    return success;
}


function arrayCount(array, predicate) {
    let count = 0;

    scope(arrayCount.name, context => {
        assert(() => isArray(array));

        loop(array, a => {
            if (predicate(a)) {
                count++;
            }
        })
    });

    return count;
}

function stringSuffix(string, count) {
    let result;
    scope(stringSuffix.name, context => {
        assert(() => isString(string));

        assert(() => isInteger(count));
        assert(() => 0 <= count);
        assert(() => count <= string.length);

        result = string.substring(string.length - count);
    });
    return result;
}
},{"./core":4,"./library/assert":7,"./library/isUndefined":12,"./library/merge":13,"./library/scope":16,"./log":19}],21:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"./assert":22,"./commandLine":23,"./core":24,"./file":25,"./index":26,"./log":41,"./tools":42,"dup":1}],22:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"./core":24,"./library/assert":28,"./library/isUndefined":34,"./library/merge":35,"./library/scope":38,"./log":41,"dup":2,"fs":46}],23:[function(require,module,exports){
(function (process){
const { 
    isString,
} = require('./core');

const scope = require('./library/scope');
const assert = require('./library/assert');
const merge = require('./library/merge');
const isArray = require('./library/isArray');

const { 
    loop,
} = require('./tools');

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');

let verbose = false;

module.exports = {
    commandLine,
    fn,
    baseDirectory: '.',
    /** Whether or not this is the wlj-utilities NPM package */
    isWljUtilitiesPackage: false
};

function commandLine() {
    scope(commandLine.name, x=> {
        let commands = {
            fn,
        };

        let command = commands[process.argv[2]];
        if (!command) {
            console.log('Please use a command-line argument.');
            console.log('Valid command-line arguments:');
            loop(Object.keys(commands), c => {
                console.log(c);
            });
            return;
        }
        
        let remaining = process.argv.slice(3);
        if (verbose) {
            console.log('Calling: ' + command.name);
            console.log('Args: ' + remaining);
        }
        let result = command(remaining);
        console.log(result);
    
    });
}

function fn(args) {
    let result = [];
    scope(fn.name, x => {
        merge(x, {args});
        assert(() => isArray(args));

        if (args.length !== 1) {
            result.push('Expecting 1 argument');
            return;
        }

        let fnName = args[0];
        assert(() => isString(fnName));

        const library = 'library';
        let libDirectory = path.join(module.exports.baseDirectory, library);
        if (!fs.existsSync(libDirectory)) {
            fs.mkdirSync(libDirectory);
            result.push('Created ' + libDirectory);
        }

        let fnFile = path.join(libDirectory, fnName + '.js');
        assert(() => !fs.existsSync(fnFile));
        fs.writeFileSync(fnFile, `
${module.exports.isWljUtilitiesPackage ? 'const scope = require("./scope");' : 'const u = require("wlj-utilities");' }

module.exports = ${fnName};

function ${fnName}() {
    let result;
    ${module.exports.isWljUtilitiesPackage ? '' : 'u.'}scope(${fnName}.name, x => {

    });
    return result;
}
`);
        assert(() => fs.existsSync(fnFile));
        result.push('Created ' + fnFile);

        let testsDirectory = path.join(module.exports.baseDirectory, 'tests');
        if (!fs.existsSync(testsDirectory)) {
            fs.mkdirSync(testsDirectory);
            result.push('Created ' + testsDirectory);
        }

        let fnTestDirectory = path.join(testsDirectory, fnName);
        if (!fs.existsSync(fnTestDirectory)) {
            fs.mkdirSync(fnTestDirectory);
            result.push('Created ' + fnTestDirectory);
        }

        let testFile = path.join(fnTestDirectory, fnName + '.js');
        assert(() => !fs.existsSync(testFile));
        fs.writeFileSync(testFile, `
const u = require("${module.exports.isWljUtilitiesPackage ? '../../all' : 'wlj-utilities' }");

const ${fnName} = require("../../${library}/${fnName}.js");

u.scope(__filename, x => {

});
`);
        assert(() => fs.existsSync(testFile));
        result.push('Created ' + testFile);

        let allTestsFile = path.join(module.exports.baseDirectory, 'test.js');
        if (!fs.existsSync(allTestsFile)) {
            fs.writeFileSync(allTestsFile, '');
            result.push('Created ' + allTestsFile);
        } else {
            result.push('Modified ' + allTestsFile);
        }
        fs.appendFileSync(allTestsFile, EOL);
        fs.appendFileSync(allTestsFile, `require("./${testFile}");`)

        let indexFile = path.join(module.exports.baseDirectory, 'index.js');
        if (!fs.existsSync(indexFile)) {
            fs.writeFileSync(indexFile, 'module.exports = {};');
            result.push('Created ' + indexFile);
        } else {
            result.push('Modified ' + indexFile);
        }
        fs.appendFileSync(indexFile, EOL);
        fs.appendFileSync(indexFile, `module.exports.${fnName} = require("./library/${fnName}.js");`);
        result.push('Finished');
    });

    return result.join(EOL);
}
}).call(this,require('_process'))
},{"./core":24,"./library/assert":28,"./library/isArray":33,"./library/merge":35,"./library/scope":38,"./tools":42,"_process":49,"fs":46,"os":47,"path":48}],24:[function(require,module,exports){
(function (process){
const isUndefined = require('./library/isUndefined');

module.exports = {
    processExit,
    isEqualJson,
    isDefined,
    isInteger,
    range,
    isFunction,
    isString,
}

function isString(s) {
    return (s + "") === s;
}

function processExit() {
    let log = true;
    if (log) {
        let stack = new Error().stack;
        console.log(stack);
    }
    console.log('Calling process.exit(1)');
    process.exit(1);
}

function isEqualJson(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function isDefined(a) {
    return !isUndefined(a);
}

function isInteger(a) {
    return parseInt(a, 10) === a;
}

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function range(count, start) {
    if (isUndefined(start)) {
        start = 0;
    }
    let result = [];
    let max = start + count - 1;
    for (let i = start; i <= max; i++) {
        result.push(i);
    }
    return result;
}
}).call(this,require('_process'))
},{"./library/isUndefined":34,"_process":49}],25:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"./assert":22,"./core":24,"./library/assert":28,"./library/isUndefined":34,"./library/merge":35,"./library/scope":38,"./tools":42,"dup":5,"fs":46,"path":48}],26:[function(require,module,exports){
module.exports = {};
module.exports.throws = require("./library/throws.js");
module.exports.assertIsJsonResponse = require("./library/assertIsJsonResponse.js");
module.exports.assertIsEqualJson = require("./library/assertIsEqualJson.js");
module.exports.assert = require("./library/assert.js");
module.exports.scope = require("./library/scope.js");
module.exports.propertiesToString = require("./library/propertiesToString.js");
module.exports.toQueryString = require("./library/toQueryString.js");
module.exports.propertiesAreEqual = require("./library/propertiesAreEqual.js");
module.exports.assertIsStringArray = require("./library/assertIsStringArray.js");
module.exports.assertOnlyContainsProperties = require("./library/assertOnlyContainsProperties.js");
module.exports.merge = require("./library/merge.js");
module.exports.arrayExcept = require("./library/arrayExcept.js");
module.exports.isArray = require("./library/isArray.js");
},{"./library/arrayExcept.js":27,"./library/assert.js":28,"./library/assertIsEqualJson.js":29,"./library/assertIsJsonResponse.js":30,"./library/assertIsStringArray.js":31,"./library/assertOnlyContainsProperties.js":32,"./library/isArray.js":33,"./library/merge.js":35,"./library/propertiesAreEqual.js":36,"./library/propertiesToString.js":37,"./library/scope.js":38,"./library/throws.js":39,"./library/toQueryString.js":40}],27:[function(require,module,exports){

const scope = require("./scope");
const isArray = require("./isArray");
const assert = require("./assert");

module.exports = arrayExcept;

function arrayExcept(array, except) {
    let result;
    scope(arrayExcept.name, x => {
        assert(() => isArray(array));
        assert(() => isArray(except));
        
        result = [];

        for (let a of array) {
            if (except.includes(a)) {
                continue;
            }
            result.push(a);
        }
    });
    return result;
}

},{"./assert":28,"./isArray":33,"./scope":38}],28:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"../core":24,"./merge":35,"./scope":38,"dup":7}],29:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"../core":24,"./assert":28,"./merge":35,"./scope":38,"dup":8}],30:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"./../core":24,"./assert":28,"./merge":35,"./scope":38,"dup":9}],31:[function(require,module,exports){

const assert = require("./assert");
const scope = require("./scope");
const isArray = require("./isArray");
const isString = require("./../core").isString;

module.exports = assertIsStringArray;

function assertIsStringArray(array) {
    let result;
    scope(assertIsStringArray.name, x => {
        assert(() => isArray(array));

        for (let a of array) {
            assert(() => isString(a));
        }
    });
    return result;
}

},{"./../core":24,"./assert":28,"./isArray":33,"./scope":38}],32:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"./../core":24,"./assert":28,"./assertIsStringArray":31,"./merge":35,"./scope":38,"dup":11}],33:[function(require,module,exports){
module.exports = isArray;

function isArray(a) {
    return Array.isArray(a);
}
},{}],34:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],35:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"./isUndefined":34,"./scope":38,"dup":13}],36:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"./assert":28,"./assertIsStringArray":31,"./assertOnlyContainsProperties":32,"./scope":38,"dup":14}],37:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./../core":24,"./../log":41,"./isUndefined":34,"dup":15}],38:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"../core":24,"./propertiesToString":37,"dup":16}],39:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./../core":24,"./../library/assert":28,"./../library/scope":38,"dup":17}],40:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"./../core":24,"./assert":28,"./merge":35,"./scope":38,"dup":18}],41:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./core":24,"dup":19}],42:[function(require,module,exports){
const isUndefined = require('./library/isUndefined');
const merge = require('./library/merge');
const assert = require('./library/assert');
const isArray = require('./library/isArray');

const {
    isFunction,
    isDefined,
    isString,
    isInteger,
} = require('./core');

const scope = require('./library/scope');

const {
    consoleLog,
} = require('./log');

module.exports = {
    loop,
    toDictionary,
    isArrayIndex,
    arrayLast,
    arrayAll,
    arraySome,
    isDistinct,
    loopPairs,
    arrayMax,
    arrayMin,
    arrayCount,
    arrayMin,
    stringSuffix,
};

/**
 * Return true to break out of loop.
 */
function loop(array, lambda) {
    let log = false;
    scope(loop.name, context => {
        merge(context, {array});
        merge(context, {lambda});

        assert(() => isArray(array));
        assert(() => isFunction(lambda));
    
        for (let index = 0; index < array.length; index++) {
            merge(context, {index});
            let element = array[index];
            merge(context, {element});
            let breakLoop = lambda(element, index);
            if (breakLoop) {
                break;
            }
        }
    })
}

function toDictionary(array, property) {
    let result = {};

    scope(toDictionary.name, context => {
    
        loop(array, a => {
            let key = a[property];
            merge(context, {key});
            assert(() => isDefined(key));
    
            if (result[key]) {
                throw new Error('Duplicate key');
            }
            result[key] = a; 
        });
    })

    return result;
}

function isArrayIndex(array, index) {
    let result;
    scope(isArrayIndex.name, x => {
        merge(x,{array});
        merge(x,{index});
        let ia = isArray(array);
        merge(x,{ia});
        let is = isString(array);
        merge(x,{is});
        assert(() => ia || is);
        let ii = isInteger(index);
        merge(x,{ii});
        assert(() => ii);
        let lower = 0 <= index;
        let upper = index < array.length;
        merge(x,{lower});
        merge(x,{upper});
        result = lower && upper;
    });
    return result;
}

function arrayLast(array) {
    assert(() => isArray(array) || isString(array));
    return array[array.length - 1];
}
function arrayMax(array) {
    let max;

    scope(arrayAll.name, context => {
        assert(() => isArray(array));
        
        max = array[0]

        loop(array, a => {
            if (a > max) {
                max = a;
            }
        })
    });

    return max;
}
function arrayMin(array) {
    let min;

    scope(arrayAll.name, context => {
        assert(() => isArray(array));
        
        min = array[0]

        loop(array, a => {
            if (a < min) {
                min = a;
            }
        })
    });

    return min;
}

/**
 * Returns true if array is empty
 * or if predicate is true for each element
 * of the array
 * @param {*} array 
 * @param {*} predicate 
 */
function arrayAll(array, predicate) {
    let success = true;

    scope(arrayAll.name, context => {
        assert(() => isArray(array));

        loop(array, a => {
            if (!predicate(a)) {
                success = false;
                return true;
            }
        })
    });

    return success;
}

/**
 * Returns false if array is empty
 * or if predicate is true for some element
 * of the array
 * @param {*} array 
 * @param {*} predicate 
 */
function arraySome(array, predicate) {
    let success = false;

    scope(arraySome.name, context => {
        assert(() => isArray(array));

        loop(array, a => {
            if (predicate(a)) {
                success = true;
                return true;
            }
        })
    });

    return success;
}

function loopPairs(array, lambda) {
    scope(loopPairs.name, context => {
        loop(array, (a, i) => {
            let result;
            loop(array, (b, j) => {
                if (j <= i) {
                    return;
                }
    
                result = lambda(a, b);
                if (result) {
                    return true;
                }
            });
            if (result) {
                return true;
            }
        });
    });
}

function isDistinct(array) {
    let success = true;

    scope(isDistinct.name, context => {
        assert(() => isArray(array));

        loopPairs(array, (a, b) => {
            if (a === b) {
                success = false;
            }
        });
    });

    return success;
}


function arrayCount(array, predicate) {
    let count = 0;

    scope(arrayCount.name, context => {
        assert(() => isArray(array));

        loop(array, a => {
            if (predicate(a)) {
                count++;
            }
        })
    });

    return count;
}

function stringSuffix(string, count) {
    let result;
    scope(stringSuffix.name, context => {
        assert(() => isString(string));

        assert(() => isInteger(count));
        assert(() => 0 <= count);
        assert(() => count <= string.length);

        result = string.substring(string.length - count);
    });
    return result;
}
},{"./core":24,"./library/assert":28,"./library/isArray":33,"./library/isUndefined":34,"./library/merge":35,"./library/scope":38,"./log":41}],43:[function(require,module,exports){
require("./tests/ask/ask.js");
require("./tests/prayersAreEqual/prayersAreEqual.js");
},{"./tests/ask/ask.js":44,"./tests/prayersAreEqual/prayersAreEqual.js":45}],44:[function(require,module,exports){
(function (__filename){

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

}).call(this,"/tests/ask/ask.js")
},{"../../library/ask.js":"/library/ask.js","wlj-utilities":21}],45:[function(require,module,exports){
(function (__filename){

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

}).call(this,"/tests/prayersAreEqual/prayersAreEqual.js")
},{"../../library/prayersAreEqual.js":"/library/prayersAreEqual.js","wlj-utilities":21}],"/library/ask.js":[function(require,module,exports){
const u = require('wlj-utilities');
const letters = require('./letters');
const petitions = require('./petitions');

module.exports = ask;

function ask(request) {
    let result = {};
    u.scope(ask.name, x => {
        u.merge(x, {request});
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
},{"./letters":"/library/letters.js","./petitions":"/library/petitions.js","wlj-utilities":1}],"/library/countries.js":[function(require,module,exports){
const countries = [
    "United States",
    "Mexico"
];

module.exports = countries;
},{}],"/library/letters.js":[function(require,module,exports){
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
},{}],"/library/petitions.js":[function(require,module,exports){
module.exports = [
    'Salvation',
    'Wisdom',
    'Patience',
]
},{}],"/library/prayersAreEqual.js":[function(require,module,exports){

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

},{"wlj-utilities":1}],"/library/publish.js":[function(require,module,exports){
(function (__dirname){
const {
    execSync,
} = require("child_process");

const path = require('path');

// Run tests before bumping.
require('../test');

const u = require('wlj-utilities');

u.bumpPackageVersion(__dirname);

execSync('npm publish');
}).call(this,"/library")
},{"../test":43,"child_process":46,"path":48,"wlj-utilities":1}],46:[function(require,module,exports){

},{}],47:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

exports.homedir = function () {
	return '/'
};

},{}],48:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":49}],49:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[]);
