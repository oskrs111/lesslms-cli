/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz <osanzl@uoc.edu>
 * @module lib/deploy
 * @license MIT
 */
const _sourcesUri = 'https://api.github.com/repos/oskrs111/lesslms-devel/releases/latest';
const fs = require('fs');
const AWS = require('aws-sdk');
const csv = require('csv-parser')
const log = require('../src/log');
const path = require('path');
const got = require('got');
const gotZip = require('got-zip');
const _path = path.join(__dirname, '../', 'serverless');

/**
 * Variable to store AWS config.
 * @var
 */
let _config = {};

/**
 * Variable to store generator instances.
 * @var
 */
let _gen = {};

/**
 * Variable to store generator instances.
 * @var
 */
let _gend = {};

/**
 * Entry point for lib/deploy module.
 * @function
 */
function _main() {
    log('> lesslms deploy...', 'info');
    let _param = _configGet('region');
    if (_param == null) {
        log(`Param "region" is not defined in "serverless.json"`, 'error');
        return;
    }

    _getCredentials((error, credentials) => {
        if (error != undefined) {
            log(`> ERROR > getting credentials from "credentials.csv": ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        }
        //OSLL: Prepare AWS interface configuration.
        _config = new AWS.Config({
            accessKeyId: credentials['Access key ID'],
            secretAccessKey: credentials['Secret access key'],
            region: _param
        });

        AWS.config.update(_config);

        _gend = _deploy((error) => {});
        _gend.next();
    });
}

/**
 * Runs the deployment sequence.
 * @generator
 * @param {stobject} credentials AWS credentials object.
 * @callback cbk
 */

/**
 * Called on completion.
 * @param {cbk} callback Error first callback. 
 */
function* _deploy(callback) {
    _gen = _getSources(_sourcesUri, (error) => {
        if (error != undefined) {
            log(`> ERROR > running deployment: ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        }
        _gend.next();
    });
    _gen.next(); //OSLL: Activates '_getSources()' generator.
    yield;

    _gen = _createBucket(_config.region, (error, bucket) => {
        if (error != undefined) {
            log(`> ERROR > creating bucket: ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        }
        _configSet('bucketName', bucket.name);
        _configSet('bucketUri', bucket.uri);
        _gend.next();

    });
    _gen.next(); //OSLL: Activates '_createBucket()' generator.
    yield;

    callback(); //OSLL: Success!
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
    fs.createReadStream(path.join(__dirname, '../', 'serverless', 'credentials.csv'))
        .pipe(csv())
        .on('data', (data) => {
            _cred = data;
        })
        .on('end', () => {
            callback(null, _cred);
        });
}

/**
 * Fetches the zipped sources functions from releases repository.
 * @generator
 * @param {string} uri Github API uri reference to get last release information.
 * @callback cbk
 */

/**
 * Called on completion.
 * @param {cbk} callback Error first callback. 
 */
function* _getSources(uri, callback) {
    log(`> Fetching last release source from: ${uri}`, 'info');
    let _source = '';
    let _sourceName = '';
    let _got = got(_sourcesUri);

    _got.then((data) => {
        _source = JSON.parse(data.body).assets[0].browser_download_url;
        _sourceName = JSON.parse(data.body).assets[0].name;
        _gen.next();

    }, (reason) => {
        log(`> ERROR > getting last release: ${JSON.stringify(reason)}`, 'error');
        _gen.return(false); //OSLL: Error!
        callback(reason);
    });
    yield;

    log(`> Getting Sources from: ${_source}`, 'info');
    let _argsz = {
        dest: _path,
        extract: true,
        cleanup: false,
        strip: 0
    };

    _got = gotZip(_source, _argsz);
    _got.then((data) => {
        log(`> Getting Lambdas END`, 'info');
        _gen.next();
    }, (reason) => {
        log(`> ERROR > getting Lambdas: ${JSON.stringify(reason)}`, 'error');
        _gen.return(false); //OSLL: Error!
        callback(reason);
    });
    yield;
    callback(); //OSLL: Success!
}

/**
 * Creates a s3 bucket in AWS and uploads the Lambda source code.
 * @generator
 * @param {string} region AWS region where create the new bucket.
 * @callback cbk
 */

/**
 * Called on completion.
 * @param {cbk} callback Error first callback, returns also with the new bucket name.
 */
function* _createBucket(region, callback) {
    let _location = {};
    let _bucket = `lesslms-${new Date().getTime()}`;
    let params = {
        Bucket: _bucket,
        CreateBucketConfiguration: {
            LocationConstraint: region
        }
    };

    log(`> Setting up a new s3 bucket "${_bucket}"`, 'info');
    let s3 = new AWS.S3();
    s3.createBucket(params, function(error, data) {
        if (error) {
            _gen.return(false); //OSLL: Error!
            callback(error);
        } else {
            _location.name = _bucket;
            _location.uri = data.Location;
            _gen.next();
        }
    });
    yield;
    log(`> New bucket is located at "${_location.uri}"`, 'info');
    callback(null, _location); //OSLL: Success!
}

/**
 * Helper function to retrieve parameters from 'serverless.json' config file.
 * @function
 * @param {string} parameter Parameter name to retrieve.
 */
function _configGet(parameter) {
    let _read = fs.readFileSync(path.join(__dirname, '../', 'serverless.json'));
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
    let _read = fs.readFileSync(path.join(__dirname, '../', 'serverless.json'));
    let _obj = JSON.parse(_read);
    _obj[parameter] = value;

    fs.writeFileSync(path.join(__dirname, '../', 'serverless.json'), JSON.stringify(_obj, null, 4));
}


module.exports = _main;