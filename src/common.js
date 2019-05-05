/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz Llopis <osanzl@uoc.edu>
 * @module src/common
 * @license MIT
 */
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const csv = require('csv-parser');
const process = require('process');

const _flavors = {
    def: chalk.white,
    info: chalk.bold.yellow,
    error: chalk.bold.red,
    result: chalk.inverse.yellow,
    warning: chalk.bold.keyword('orange'),
    progress: chalk.bold.green
}

/**
 * Custom logging function for lesslms-cli tool.
 * @function
 * @param {string} string String to log out to console.
 * @param {string} level Type of log: 'info' | 'progress' | 'warning' | 'error'. 
 */
function _log(string, level) {
    _chalk = _flavors['def'];
    switch (level) {
        case 'info':
        case 'error':
        case 'result':
        case 'warning':
        case 'progress':
            _chalk = _flavors[level];
            break;

        default:
            break;

    }
    console.log(_chalk(string));
}

/**
 * Proceses AWS "credentials.csv" file.
 * @generator
 * @callback cbk
 */

/**
 * Called on completion.
 * @param {cbk} callback Error first callback, returns also with credentials object.
 */
function _getCredentials(callback) {
    let _cred = {};
    fs.createReadStream(path.join(process.cwd(), 'serverless', 'credentials.csv'))
        .pipe(csv())
        .on('data', (data) => {
            _cred = data;
        })
        .on('end', () => {
            callback(null, _cred);
        });
}

/**
 * Helper function to retrieve parameters from 'serverless.json' config file.
 * @function
 * @param {string} parameter Parameter name to retrieve.
 */
function _configGet(parameter) {
    let _read = fs.readFileSync(path.join(process.cwd(), 'serverless.json'));
    let _obj = JSON.parse(_read);
    if (_obj[parameter] != undefined) {
        return _obj[parameter];
    } else return null;
}

/**
 * Helper function to store parameters to 'serverless.json' config file.
 * @function
 * @param {string} parameter Parameter name to update.
 * @param {string} value Parameter value to update.
 */
function _configSet(parameter, value) {
    let _read = fs.readFileSync(path.join(process.cwd(), 'serverless.json'));
    let _obj = JSON.parse(_read);
    _obj[parameter] = value;

    fs.writeFileSync(path.join(process.cwd(), 'serverless.json'), JSON.stringify(_obj, null, 4));
}

module.exports.log = _log;
module.exports.getCredentials = _getCredentials;
module.exports.configGet = _configGet;
module.exports.configSet = _configSet;