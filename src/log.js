/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz <osanzl@uoc.edu>
 * @module src/log
 * @license MIT
 */
const chalk = require('chalk');
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
    const supportsColor = require('supports-color');
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

module.exports = _log;