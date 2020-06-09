require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const merge = require("./library/merge.js");
const core = require('./core');
const log = require('./log');
const assert = require('./assert');
const file = require('./file');
const tools = require('./tools');
const commandLine = require('./commandLine');

module.exports = {};
merge(module.exports, core);
merge(module.exports, log);
merge(module.exports, assert);
merge(module.exports, file);
merge(module.exports, tools);
merge(module.exports, commandLine);
},{"./assert":2,"./commandLine":3,"./core":4,"./file":5,"./library/merge.js":31,"./log":42,"./tools":43}],2:[function(require,module,exports){
const scope = require('./library/scope');
const isDefined = require('./library/isDefined');
const merge = require('./library/merge');
const assert = require('./library/assert');
const isFunction = require('./library/isFunction');

const fs = require('fs');

module.exports = {
    assertFileExists,
    assertAtLeast,
    assertAtMost,
    assertIsEqual,
    assertIsDefined,
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
},{"./library/assert":11,"./library/isDefined":24,"./library/isFunction":25,"./library/merge":31,"./library/scope":36,"fs":44}],3:[function(require,module,exports){
(function (process){
const isString = require('./library/isString');
const scope = require('./library/scope');
const assert = require('./library/assert');
const merge = require('./library/merge');
const isArray = require('./library/isArray');
const isInteger = require('./library/isInteger');
const isUndefined = require('./library/isUndefined');
const loop = require('./library/loop');
const { deleteDirectory } = require('./file');

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');

let verbose = false;

module.exports = {
    commandLine,
    functionCreate,
    baseDirectory: '.',
    /** Whether or not this is the wlj-utilities NPM package */
    isWljUtilitiesPackage: false
};

const defaultCommands = {
    functionCreate,
    functionTest,
    functionDelete,
    functionRename,
}

function commandLine(commands) {
    scope(commandLine.name, x => {
        if (isUndefined(commands)) {
            commands = defaultCommands;
        }

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
        let messages = [];
        command(remaining, messages);
        console.log(messages.join(EOL));
    });
}

const library = 'library';

function getFunctionName(args, messages, i) {
    let result;
    scope(getFunctionName.name, x => {
        merge(x, { args });
        assert(() => isArray(args));
        assert(() => isArray(messages));
        assert(() => isInteger(i));
        assert(() => 0 <= i);

        if (args.length < 1) {
            messages.push('Expecting at least 1 argument');
            return;
        }

        let fnName = args[i];
        assert(() => isString(fnName));
        result = fnName;
    });
    return result;
}

function getLibraryDirectory(messages) {
    let libDirectory = path.join(module.exports.baseDirectory, library);
    if (!fs.existsSync(libDirectory)) {
        fs.mkdirSync(libDirectory);
        messages.push('Created ' + libDirectory);
    }
    return libDirectory;
}

function getTestsDirectory() {
    let testsDirectory = path.join(module.exports.baseDirectory, 'tests');
    return testsDirectory;
}

function getFunctionTestsDirectory(messages, fnName) {
    let result;
    scope(getFunctionTestsDirectory.name, x => {
        let testsDirectory = getTestsDirectory(messages);
        if (!fs.existsSync(testsDirectory)) {
            fs.mkdirSync(testsDirectory);
            messages.push('Created ' + testsDirectory);
        }
    
        let fnTestDirectory = path.join(testsDirectory, fnName);
        result = fnTestDirectory;
    })
    return result;
}

function functionTest(args, messages) {
    let fnName = getFunctionName(args, messages, 0);

    let fnFile = getFunctionFile(messages, fnName);
    assert(() => fs.existsSync(fnFile));

    let fnTestDirectory = getFunctionTestsDirectory(messages, fnName);
    if (!fs.existsSync(fnTestDirectory)) {
        fs.mkdirSync(fnTestDirectory);
        messages.push('Created ' + fnTestDirectory);
    }

    let i = 1;
    let testFile;
    do {
        testFile = path.join(fnTestDirectory, i + '.js');
        i++;
    } while (fs.existsSync(testFile));
    assert(() => !fs.existsSync(testFile));
    fs.writeFileSync(testFile, `
const u = require("${module.exports.isWljUtilitiesPackage ? '../../index' : 'wlj-utilities'}");

const ${fnName} = require("../../${library}/${fnName}.js");
const index = require("../../index.js");

u.scope(__filename, x => {
// TODO: Fix broken test
u.assert(false);
});
`);
    assert(() => fs.existsSync(testFile));
    messages.push('Created ' + testFile);

    let allTestsFile = path.join(module.exports.baseDirectory, 'test.js');
    if (!fs.existsSync(allTestsFile)) {
        fs.writeFileSync(allTestsFile, '');
        messages.push('Created ' + allTestsFile);
    } else {
        messages.push('Modified ' + allTestsFile);
    }
    fs.appendFileSync(allTestsFile, EOL);
    fs.appendFileSync(allTestsFile, `require("./${testFile}");`)
}

function functionRename(args, messages) {
    let fromName = getFunctionName(args, messages, 0);
    let toName = getFunctionName(args, messages, 1);

    let fromFile = getFunctionFile(messages, fromName);
    let toFile = getFunctionFile(messages, toName);

    assert(() => fs.existsSync(fromFile));
    assert(() => !fs.existsSync(toFile));
    fs.renameSync(fromFile, toFile);
    messages.push(`Renamed from ${fromFile} to ${toFile}`);

    let fromTests = getFunctionTestsDirectory(messages, fromName);
    let toTests = getFunctionTestsDirectory(messages, toName);

    assert(() => fs.existsSync(fromTests));
    assert(() => !fs.existsSync(toTests));
    fs.renameSync(fromTests, toTests);
    messages.push(`Renamed from ${fromTests} to ${toTests}`);
}

function getFunctionFile(messages, fnName) {
    let result;
    scope(getFunctionFile.name, x => {
        merge(x, {messages});
        let libDirectory = getLibraryDirectory(messages);

        let fnFile = path.join(libDirectory, fnName + '.js');
        result = fnFile;
    })
    return result;
}

function functionCreate(args, messages) {
    scope(functionCreate.name, x => {
        merge(x, {messages});

        let fnName = getFunctionName(args, messages, 0);

        let fnFile = getFunctionFile(messages, fnName);
        merge(x, {fnFile});
        assert(() => !fs.existsSync(fnFile));
        fs.writeFileSync(fnFile, `
${module.exports.isWljUtilitiesPackage ? 'const scope = require("./scope");' : 'const u = require("wlj-utilities");'}

module.exports = ${fnName};

function ${fnName}() {
    let result;
    ${module.exports.isWljUtilitiesPackage ? '' : 'u.'}scope(${fnName}.name, x => {
        // TODO
    });
    return result;
}
`);
        assert(() => fs.existsSync(fnFile));
        messages.push('Created ' + fnFile);

        functionTest(args, messages);

        let indexFile = path.join(module.exports.baseDirectory, 'index.js');
        if (!fs.existsSync(indexFile)) {
            fs.writeFileSync(indexFile, 'module.exports = {};');
            messages.push('Created ' + indexFile);
        } else {
            messages.push('Modified ' + indexFile);
        }
        fs.appendFileSync(indexFile, EOL);
        fs.appendFileSync(indexFile, `module.exports.${fnName} = require("./library/${fnName}.js");`);
        messages.push('Finished');
    });
}

function functionDelete(args, messages) {
    scope(functionDelete.name, x => {
        let fnName = getFunctionName(args, messages, 0);

        let fnFile = getFunctionFile(messages, fnName);

        if (fs.existsSync(fnFile)) {
            fs.unlinkSync(fnFile);
            messages.push('Deleted ' + fnFile);
        } else {
            messages.push('Does not exist: ' + fnFile);
        }

        let fnTestDirectory = getFunctionTestsDirectory(messages, fnName);

        if (fs.existsSync(fnTestDirectory)) {
            deleteDirectory(fnTestDirectory);
            messages.push('Deleted ' + fnTestDirectory);
        } else {
            messages.push('Does not exist: ' + fnTestDirectory);
        }

        // TODO: modify index.js and test.js
    });
}
}).call(this,require('_process'))
},{"./file":5,"./library/assert":11,"./library/isArray":23,"./library/isInteger":26,"./library/isString":28,"./library/isUndefined":29,"./library/loop":30,"./library/merge":31,"./library/scope":36,"_process":47,"fs":44,"os":45,"path":46}],4:[function(require,module,exports){
(function (process){
const isUndefined = require('./library/isUndefined');
const isString = require('./library/isString');
const config = require('./library/config');

module.exports = {
    processExit,
    isEqualJson,
}

function processExit() {
    let log = false;
    if (log) {
        let stack = new Error().stack;
        console.log(stack);
    }
    if (config.processExit) {
        console.log('Calling process.exit(1)');
        process.exit(1);
    } else {
        console.log('config.processExit is false; Not calling process.exit(1)');
    }
}

function isEqualJson(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
}).call(this,require('_process'))
},{"./library/config":20,"./library/isString":28,"./library/isUndefined":29,"_process":47}],5:[function(require,module,exports){
const scope = require('./library/scope');
const isString = require('./library/isString');
const isDefined = require('./library/isDefined');
const loop = require('./library/loop');
const merge = require('./library/merge');
const assert = require('./library/assert');

const {
    assertFileExists,
    assertIsEqual,
} = require('./assert');

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
    scope(deleteDirectory.name, x => {
        merge(x, {directory});
        
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
    let result;
    let log = false;
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

        result = nextVersion;
    });
    return result;
}
},{"./assert":2,"./library/assert":11,"./library/isDefined":24,"./library/isString":28,"./library/loop":30,"./library/merge":31,"./library/scope":36,"fs":44,"path":46}],6:[function(require,module,exports){
let all = require('./all');

module.exports = {};
module.exports.merge = require("./library/merge.js");

module.exports.merge(module.exports, all);

module.exports.throws = require("./library/throws.js");
module.exports.assertIsJsonResponse = require("./library/assertIsJsonResponse.js");
module.exports.assertIsEqualJson = require("./library/assertIsEqualJson.js");
module.exports.assert = require("./library/assert.js");
module.exports.scope = require("./library/scope.js");
module.exports.propertiesToString = require("./library/propertiesToString.js");
module.exports.toQueryString = require("./library/toQueryString.js");
module.exports.propertiesAreEqualAndOnlyContainsProperties = require("./library/propertiesAreEqualAndOnlyContainsProperties.js");
module.exports.assertIsStringArray = require("./library/assertIsStringArray.js");
module.exports.assertOnlyContainsProperties = require("./library/assertOnlyContainsProperties.js");
module.exports.arrayExcept = require("./library/arrayExcept.js");
module.exports.isArray = require("./library/isArray.js");
module.exports.assertThrows = require("./library/assertThrows.js");
module.exports.arrayContainsDuplicates = require("./library/arrayContainsDuplicates.js");
module.exports.range = require("./library/range.js");
module.exports.isInteger = require("./library/isInteger.js");
module.exports.isString = require("./library/isString.js");
module.exports.isFunction = require("./library/isFunction.js");
module.exports.isSetEqual = require("./library/isSetEqual.js");
module.exports.config = require("./library/config.js");
module.exports.arraySingle = require("./library/arraySingle.js");
module.exports.propertiesAreEqual = require("./library/propertiesAreEqual.js");
module.exports.loop = require("./library/loop.js");
module.exports.stringTrimLambdaPrefix = require("./library/stringTrimLambdaPrefix.js");
module.exports.isDefined = require("./library/isDefined.js");
module.exports.isUndefined = require("./library/isUndefined.js");
module.exports.getUniqueFileName = require("./library/getUniqueFileName.js");
module.exports.EOL = require("./library/helpers.js").EOL;
module.exports.splitByEOL = require("./library/splitByEOL.js");
module.exports.assertIsString = require("./library/assertIsString.js");
module.exports.unwrapIfLambda = require("./library/unwrapIfLambda.js");
module.exports.assertIsStringArrayNested = require("./library/assertIsStringArrayNested.js");
module.exports.arraySequenceEquals = require("./library/arraySequenceEquals.js");
module.exports.assertIsArray = require("./library/assertIsArray.js");
},{"./all":1,"./library/arrayContainsDuplicates.js":7,"./library/arrayExcept.js":8,"./library/arraySequenceEquals.js":9,"./library/arraySingle.js":10,"./library/assert.js":11,"./library/assertIsArray.js":12,"./library/assertIsEqualJson.js":13,"./library/assertIsJsonResponse.js":14,"./library/assertIsString.js":15,"./library/assertIsStringArray.js":16,"./library/assertIsStringArrayNested.js":17,"./library/assertOnlyContainsProperties.js":18,"./library/assertThrows.js":19,"./library/config.js":20,"./library/getUniqueFileName.js":21,"./library/helpers.js":22,"./library/isArray.js":23,"./library/isDefined.js":24,"./library/isFunction.js":25,"./library/isInteger.js":26,"./library/isSetEqual.js":27,"./library/isString.js":28,"./library/isUndefined.js":29,"./library/loop.js":30,"./library/merge.js":31,"./library/propertiesAreEqual.js":32,"./library/propertiesAreEqualAndOnlyContainsProperties.js":33,"./library/propertiesToString.js":34,"./library/range.js":35,"./library/scope.js":36,"./library/splitByEOL.js":37,"./library/stringTrimLambdaPrefix.js":38,"./library/throws.js":39,"./library/toQueryString.js":40,"./library/unwrapIfLambda.js":41}],7:[function(require,module,exports){

const scope = require("./scope");
const isArray = require("./isArray");
const assert = require("./assert");
const merge = require("./merge");
const range = require("./range");

module.exports = arrayContainsDuplicates;

function arrayContainsDuplicates(array) {
    let log = false;
    let result;
    scope(arrayContainsDuplicates.name, x => {
        merge(x,{array});
        assert(() => isArray(array));

        for (let i of range(array.length)) {
            merge(x,{i});
            for (let j of range(array.length)) {
                if (j <= i) {
                    continue;
                }

                if (array[i] === array[j]) {
                    if (log) console.log('arrayContainsDuplicates', { i,j })
                    result = true;
                    return;
                }
            }
        }

        if (log) console.log('arrayContainsDuplicates false');
        result = false;
    });
    return result;
}

},{"./assert":11,"./isArray":23,"./merge":31,"./range":35,"./scope":36}],8:[function(require,module,exports){

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

},{"./assert":11,"./isArray":23,"./scope":36}],9:[function(require,module,exports){

const scope = require("./scope");
const assertIsArray = require("./assertIsArray");
const range = require("./range");
const loop = require("./loop");

module.exports = arraySequenceEquals;

function arraySequenceEquals(a, b) {
    let result;
    scope(arraySequenceEquals.name, x => {
        assertIsArray(() => a);
        assertIsArray(() => b);

        if (a.length !== b.length) {
            result = false;
            return;
        }

        result = true;

        loop(range(a.length), i => {
            if (a[i] !== b[i]) {
                result = false;
                return true;
            }
        });
    });
    return result;
}

},{"./assertIsArray":12,"./loop":30,"./range":35,"./scope":36}],10:[function(require,module,exports){

const scope = require("./scope");
const loop = require("./loop");
const propertiesAreEqual = require("./propertiesAreEqual");
const merge = require("./merge");
const assert = require("./assert");
const isArray = require("./isArray");
const isDefined = require("./isDefined");

module.exports = arraySingle;

function arraySingle(array, matcher) {
    let result;
    scope(arraySingle.name, x => {
        merge(x,{array,matcher})
        assert(() => isArray(array));
        assert(() => isDefined(matcher));
        let found = false;
        let keys = Object.keys(matcher);
        merge(x,{keys})
        loop(array, a => {
            if (propertiesAreEqual(a, matcher, keys)) {
                merge(x,{result});
                assert(() => !found);
                result = a;
                found = true;
            }
        })
        let p = propertiesAreEqual(array[0], matcher, keys)
        merge(x,{p});
        assert(() => found);
    });
    return result;
}

},{"./assert":11,"./isArray":23,"./isDefined":24,"./loop":30,"./merge":31,"./propertiesAreEqual":32,"./scope":36}],11:[function(require,module,exports){

const scope = require("./scope");
const merge = require("./merge");
const isFunction = require("./isFunction");

module.exports = assert;

function assert(b) {
    let result;
    scope(assert.name, x => {
        merge(x, {b});

        let bValue;
        if (isFunction(b)) {
            delete x.b;
            merge(x, b);
            bValue = b();
        } else {
            bValue = b;
        }

        //merge(x, {bValue});
        if (bValue) {
            return;
        }

        throw new Error('assert failed');
    });
    return result;
}

},{"./isFunction":25,"./merge":31,"./scope":36}],12:[function(require,module,exports){

const scope = require("./scope");
const unwrapIfLambda = require("./unwrapIfLambda");
const assert = require("./assert");
const isArray = require("./isArray");
const merge = require("./merge");

module.exports = assertIsArray;

function assertIsArray(a) {
    let result;
    scope(assertIsArray.name, x => {
        merge(x, {a})
        let value = unwrapIfLambda(a);
        assert(() => isArray(value));
    });
    return result;
}

},{"./assert":11,"./isArray":23,"./merge":31,"./scope":36,"./unwrapIfLambda":41}],13:[function(require,module,exports){
const assert = require("./assert");
const scope = require('./scope');
const isDefined = require("./isDefined");
const isFunction = require("./isFunction");
const merge = require("./merge");

module.exports = assertIsEqualJson;

function assertIsEqualJson(left, right) {
    let result;
    scope(assertIsEqualJson.name, x => {
        merge(x, {left});
        merge(x, {right});

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

        assert(() => isDefined(left));
        assert(() => isDefined(right));
        assert(() => JSON.stringify(leftValue) === JSON.stringify(rightValue));
    });
    return result;
}

},{"./assert":11,"./isDefined":24,"./isFunction":25,"./merge":31,"./scope":36}],14:[function(require,module,exports){
const scope = require("./scope");
const assert = require("./assert");
const merge = require("./merge");
const isInteger = require("./isInteger");
const isFunction = require("./isFunction");
const isDefined = require("./isDefined");

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

},{"./assert":11,"./isDefined":24,"./isFunction":25,"./isInteger":26,"./merge":31,"./scope":36}],15:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const isString = require("./isString");
const unwrapIfLambda = require("./unwrapIfLambda");

module.exports = assertIsString;

function assertIsString(s) {
    let result;
    scope(assertIsString.name, x => {
        let value = unwrapIfLambda(s);
        assert(() => isString(value));
    });
    return result;
}

},{"./assert":11,"./isString":28,"./scope":36,"./unwrapIfLambda":41}],16:[function(require,module,exports){

const assert = require("./assert");
const scope = require("./scope");
const isArray = require("./isArray");
const isString = require("./isString");
const merge = require("./merge");
const unwrapIfLambda = require("./unwrapIfLambda");
const loop = require("./loop");

module.exports = assertIsStringArray;

function assertIsStringArray(array) {
    let result;
    scope(assertIsStringArray.name, x => {
        merge(x, {array});
        let value = unwrapIfLambda(array);
        assert(() => isArray(value));

        loop(value, v => {
            assert(() => isString(v));
        });
    });
    return result;
}

},{"./assert":11,"./isArray":23,"./isString":28,"./loop":30,"./merge":31,"./scope":36,"./unwrapIfLambda":41}],17:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const loop = require("./loop");
const isArray = require("./isArray");
const assertIsStringArray = require("./assertIsStringArray");
const merge = require("./merge");
const unwrapIfLambda = require("./unwrapIfLambda");

module.exports = assertIsStringArrayNested;

function assertIsStringArrayNested(input) {
    let result;
    scope(assertIsStringArrayNested.name, x => {
        merge(x,{input});
        let value = unwrapIfLambda(input);
        assert(() => isArray(value));
        
        loop(value, v => {
            assertIsStringArray(() => v);
        });
    });
    return result;
}

},{"./assert":11,"./assertIsStringArray":16,"./isArray":23,"./loop":30,"./merge":31,"./scope":36,"./unwrapIfLambda":41}],18:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const merge = require("./merge");
const assertIsStringArray = require("./assertIsStringArray");
const isDefined = require("./isDefined");

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

},{"./assert":11,"./assertIsStringArray":16,"./isDefined":24,"./merge":31,"./scope":36}],19:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const throws = require("./throws");
const merge = require("./merge");

module.exports = assertThrows;

function assertThrows(lambda) {
    let result;
    scope(assertThrows.name, x => {
        merge(x, {lambda});
        assert(() => throws(lambda));
    });
    return result;
}

},{"./assert":11,"./merge":31,"./scope":36,"./throws":39}],20:[function(require,module,exports){

module.exports = {
    processExit: true,
    log: {
        scopeError: true,
    }
};
},{}],21:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const isString = require("./isString");
const fs = require("fs");
const path = require("path");

module.exports = getUniqueFileName;

function getUniqueFileName(filePath) {
    let result;
    scope(getUniqueFileName.name, x => {
        if (!fs.existsSync(filePath)) {
            result = filePath;
            return;
        }
        let directory = path.dirname(filePath);
        let fileName = path.parse(filePath).name;
        let extension = path.extname(filePath);

        assert(() => isString(directory));
        assert(() => isString(fileName));
        assert(() => isString(extension));

        let i = 1;
        do {
            i++;
            result = path.join(directory, `${fileName}${i}${extension}`);
        } while (fs.existsSync(result));
    });
    return result;
}

},{"./assert":11,"./isString":28,"./scope":36,"fs":44,"path":46}],22:[function(require,module,exports){
(function (__filename){

const scope = require("./scope");
const merge = require("./merge");
const { EOL } = require('os');

scope(__filename, x => {
    module.exports = {};
    
    merge(module.exports, {EOL});
});

}).call(this,"/node_modules/wlj-utilities/library/helpers.js")
},{"./merge":31,"./scope":36,"os":45}],23:[function(require,module,exports){
module.exports = isArray;

function isArray(a) {
    return Array.isArray(a);
}
},{}],24:[function(require,module,exports){

const isUndefined = require("./isUndefined");

module.exports = isDefined;

function isDefined(a) {
    return !isUndefined(a);
}

},{"./isUndefined":29}],25:[function(require,module,exports){
module.exports = isFunction;

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}
},{}],26:[function(require,module,exports){

const scope = require("./scope");

module.exports = isInteger;

function isInteger(a) {
    let result;
    scope(isInteger.name, x => {
        result = parseInt(a, 10) === a;
    });
    return result;
}

},{"./scope":36}],27:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const isArray = require("./isArray");

module.exports = isSetEqual;

function isSetEqual(a, b) {
    let result;
    scope(isSetEqual.name, x => {
        assert(() => isArray(a));
        assert(() => isArray(b));

        result = isSubset(a, b)
            && isSubset(b, a);

        function isSubset(a, b) {
            for (let i of a) {
                if (!b.includes(i)) {
                    return false;
                }
            }
            return true;
        }
    });
    return result;
}

},{"./assert":11,"./isArray":23,"./scope":36}],28:[function(require,module,exports){

module.exports = isString;

function isString(s) {
    let result = (s + "") === s;
    return result;
}

},{}],29:[function(require,module,exports){
module.exports = isUndefined;

function isUndefined(a) {
    return typeof a === 'undefined';
}
},{}],30:[function(require,module,exports){

const scope = require("./scope");
const merge = require("./merge");
const isFunction = require("./isFunction");
const assert = require("./assert");
const isArray = require("./isArray");

module.exports = loop;

function loop(array, lambda) {
    let result;

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
    });
    return result;
}

},{"./assert":11,"./isArray":23,"./isFunction":25,"./merge":31,"./scope":36}],31:[function(require,module,exports){
const isUndefined = require('./isUndefined')
const isFunction = require('./isFunction')
const stringTrimLambdaPrefix = require('./stringTrimLambdaPrefix');

module.exports = merge;

/**
 * Does something special with undefined.
 * Does something special if b is a function.
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
    let bValue;
    if (isFunction(b)) {
        bValue = {};
        let key = stringTrimLambdaPrefix(b.toString());
        bValue[key] = b();
    } else {
        bValue = b;
    }
    for (let key in bValue) {
        a[key] = bValue[key];
        if (isUndefined(a[key])) {
            a[key] = '[undefined]';
        }
    }
}

},{"./isFunction":25,"./isUndefined":29,"./stringTrimLambdaPrefix":38}],32:[function(require,module,exports){

const scope = require("./scope");
const assertIsStringArray = require("./assertIsStringArray");
const merge = require("./merge");
const loop = require("./loop");

module.exports = propertiesAreEqual;

function propertiesAreEqual(a, b, properties) {
    let result;
    scope(propertiesAreEqual.name, x => {
        merge(x, {a,b,properties});
        assertIsStringArray(properties);

        result = true;
        loop(properties, property => {
            let equal = a[property] === b[property];
            if (!equal) {
                result = false;
                return true;
            }
        });
    });
    return result;
}

},{"./assertIsStringArray":16,"./loop":30,"./merge":31,"./scope":36}],33:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const assertOnlyContainsProperties = require("./assertOnlyContainsProperties");
const assertIsStringArray = require("./assertIsStringArray");
const propertiesAreEqual = require("./propertiesAreEqual");

module.exports = propertiesAreEqualAndOnlyContainsProperties;

function propertiesAreEqualAndOnlyContainsProperties(a, b, properties) {
    let result;
    scope(propertiesAreEqualAndOnlyContainsProperties.name, x => {
        assertOnlyContainsProperties(a, properties);
        assertOnlyContainsProperties(b, properties);
        
        result = propertiesAreEqual(a, b, properties);
    });
    return result;
}

},{"./assert":11,"./assertIsStringArray":16,"./assertOnlyContainsProperties":18,"./propertiesAreEqual":32,"./scope":36}],34:[function(require,module,exports){
const isFunction = require('./../library/isFunction');
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

},{"./../library/isFunction":25,"./../log":42,"./isUndefined":29}],35:[function(require,module,exports){

const scope = require("./scope");
const isUndefined = require("./isUndefined");
const merge = require("./merge");
const assert = require("./assert");
const isInteger = require("./isInteger");

module.exports = range;

function range(count, start) {
    let result;
    scope(range.name, x => {
        merge(x,{count});
        merge(x,{start});
        assert(() => isInteger(count));
        assert(() => count >= 0);
        if (isUndefined(start)) {
            start = 0;
        }
        
        result = [];
        let max = start + count - 1;
        for (let i = start; i <= max; i++) {
            result.push(i);
        }
    });
    return result;
}

},{"./assert":11,"./isInteger":26,"./isUndefined":29,"./merge":31,"./scope":36}],36:[function(require,module,exports){
const isString = require("./isString");
const isFunction = require("./isFunction");
const processExit = require("../core").processExit;
const propertiesToString = require("./propertiesToString");
const config = require("./config");

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
            if (config.log.scopeError) console.log(current);

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
},{"../core":4,"./config":20,"./isFunction":25,"./isString":28,"./propertiesToString":34}],37:[function(require,module,exports){

const scope = require("./scope");
const assertIsString = require("./assertIsString");
const helpers = require('./helpers');

module.exports = splitByEOL;

function splitByEOL(text) {
    let result;
    scope(splitByEOL.name, x => {
        assertIsString(() => text);
        result = text.split(helpers.EOL);
    });
    return result;
}

},{"./assertIsString":15,"./helpers":22,"./scope":36}],38:[function(require,module,exports){

const scope = require("./scope");

module.exports = stringTrimLambdaPrefix;

function stringTrimLambdaPrefix(s) {
    let result = s;

    result = result.trim();

    let parenthesis = "()";
    if (result.startsWith(parenthesis)){
        result = result.substring(parenthesis.length); 
    }
    result = result.trim();

    let arrow = "=>";

    if (result.startsWith(arrow)){
        result = result.substring(arrow.length); 
    }
    result = result.trim();

    return result;
}

},{"./scope":36}],39:[function(require,module,exports){
const scope = require("./../library/scope");
const assert = require("./../library/assert");
const isFunction = require("./../library/isFunction");

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

},{"./../library/assert":11,"./../library/isFunction":25,"./../library/scope":36}],40:[function(require,module,exports){

const scope = require("./scope");
const assert = require("./assert");
const merge = require("./merge");
const isDefined = require("./isDefined");
const isString = require("./isString");

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

},{"./assert":11,"./isDefined":24,"./isString":28,"./merge":31,"./scope":36}],41:[function(require,module,exports){

const scope = require("./scope");
const isFunction = require("./isFunction");

module.exports = unwrapIfLambda;

function unwrapIfLambda(input) {
    let result;
    scope(unwrapIfLambda.name, x => {
        if (isFunction(input)) {
            result = input();
        } else {
            result = input;
        }
    });
    return result;
}

},{"./isFunction":25,"./scope":36}],42:[function(require,module,exports){
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
},{"./core":4}],43:[function(require,module,exports){
const isInteger = require('./library/isInteger');
const isDefined = require('./library/isDefined');
const merge = require('./library/merge');
const assert = require('./library/assert');
const isArray = require('./library/isArray');
const isString = require('./library/isString');
const scope = require('./library/scope');
const loop = require('./library/loop');

module.exports = {
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
},{"./library/assert":11,"./library/isArray":23,"./library/isDefined":24,"./library/isInteger":26,"./library/isString":28,"./library/loop":30,"./library/merge":31,"./library/scope":36}],"/library/ask.js":[function(require,module,exports){
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
},{"./letters":"/library/letters.js","./petitions":"/library/petitions.js","wlj-utilities":6}],"/library/countries.js":[function(require,module,exports){
const countries = [
    "United States",
    "Mexico"
];

module.exports = countries;
},{}],"/library/getWebDirectory.js":[function(require,module,exports){

const u = require("wlj-utilities");

module.exports = getWebDirectory;

function getWebDirectory() {
    let result;
    u.scope(getWebDirectory.name, x => {
        result = 'public';
    });
    return result;
}

},{"wlj-utilities":6}],"/library/include.js":[function(require,module,exports){
// This is so a browserify build picks up these dependencies
// And makes them accessible through the browser.
// Requiring them directly didn't seem to work.

module.exports['wlj-utilities'] = require('wlj-utilities');
},{"wlj-utilities":6}],"/library/letters.js":[function(require,module,exports){
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

},{"wlj-utilities":6}],44:[function(require,module,exports){

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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
},{"_process":47}],47:[function(require,module,exports){
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
