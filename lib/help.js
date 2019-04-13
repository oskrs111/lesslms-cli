/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz <osanzl@uoc.edu>
 * @module lib/help
 * @license MIT
 */
const log = require('../src/log');
const menus = {
        main: `
  lesslms [command] <options>
    
  [command]
    init .............. initializes the lesslms sources.
    deploy ............ builds entire lesslms application on AWS account.
    useradd ........... adds new user to lesslms platform in AWS.
    version ........... show lesslms-cli version.
    help .............. show help menu for a <command>`,

        useradd: `
    lesslms useradd <options>
    --email, -e ....... the new user email address. [REQUIRED]
    --role, -r ........ role for the new user: 'editor' (default) | 'attendant'.`,
    }
    /**
     * Entry point for lib/help module.
     * @function
     */
function _main(args) {
    const subCmd = args._[0] === 'help' ?
        args._[1] :
        args._[0]

    log(menus[subCmd] || menus.main, 'info');
}

module.exports = _main;