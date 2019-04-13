/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz <osanzl@uoc.edu>
 * @module lib/deploy
 * @license MIT
 */
const _lambdasUri = 'https://api.github.com/repos/oskrs111/lesslms-devel/releases/latest';
const fs = require('fs');
const log = require('../src/log');
const path = require('path');
const got = require('got');
const gotZip = require('got-zip');
const _path = path.join(__dirname, '../', 'serverless');
/**
 * Entry point for lib/deploy module.
 * @function
 */
function _main() {
    log('> lesslms deploy...', 'info');
    _getLambdas(_lambdasUri);
}
/**
 * Fetches the zipped lambda functions from repository.
 * @function
 * @param {string} uri Github API uri reference to get last release information.
 */
function _getLambdas(uri) {
    log(`> fetching last release source from: ${uri}`, 'info');
    let _got = got(_lambdasUri);

    _got.then((data) => {
        let _source = JSON.parse(data.body).assets[0].browser_download_url;
        let _sourceName = JSON.parse(data.body).assets[0].name;

        log(`> getting Lambdas from: ${_source}`, 'info');
        let _argsz = {
            dest: _path,
            extract: true,
            cleanup: false,
            strip: 0
        };

        let _gotz = gotZip(_source, _argsz);
        _gotz.then((data) => {
            log(`> getting Lambdas END`, 'info');

        }, (reason) => {
            log(`> ERROR > getting Lambdas: ${JSON.stringify(reason)}`, 'error');
        });

    }, (reason) => {
        log(`> ERROR > getting last release: ${JSON.stringify(reason)}`, 'error');
    });
}

module.exports = _main;