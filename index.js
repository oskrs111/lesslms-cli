/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz Llopis <osanzl@uoc.edu>
 * @module index
 * @license MIT
 */
const minimist = require('minimist')
const figlet = require('figlet');
const clear = require('clear');
/**
 * Entry point for lesslms-cli.
 * @function
 */
function _main() {
    welcome();
    const args = minimist(process.argv.slice(2));
    let cmd = args._[0] || 'help';

    if (args.version || args.v) {
        cmd = 'version'
    }

    if (args.help || args.h) {
        cmd = 'help'
    }

    switch (cmd) {
        case 'init':
        case 'deploy':
        case 'clean':
        case 'help':
        case 'user':
        case 'version':
            require(`./lib/${cmd}`)(args);
            break;

        default:
            console.error(`"${cmd}" is not a valid command!`);
            break;
    }
}

/**
 * Helper function for welcome message.
 * @function
 */
function welcome() {
    clear();
    console.log(figlet.textSync('lesslms-cli'));
}

module.exports = _main;