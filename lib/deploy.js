/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz Llopis <osanzl@uoc.edu>
 * @module lib/deploy
 * @license MIT
 */
const _sourcesUri = 'https://api.github.com/repos/oskrs111/lesslms-devel/releases/latest';
const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');
const got = require('got');
const gotZip = require('got-zip');
const spinner = require('clui').Spinner;
const log = require('../src/common').log;
const getCredentials = require('../src/common').getCredentials;
const configGet = require('../src/common').configGet;
const configSet = require('../src/common').configSet;

const _path = path.join(__dirname, '../', 'serverless');

/**
 * Object to control wait processes.
 * @object
 */
let _wait_g = {
    s: {},
    t: 0
}

/**
 * Variable to control timers.
 * @var
 */
let _timer_g = null;

/**
 * Variable to store CloudFormation instance.
 * @var
 */
let cf = {};

/**
 * Variable to store s3 instance.
 * @var
 */
let s3 = {};

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

    getCredentials((error, credentials) => {
        if (error != undefined) {
            log(`> ERROR > getting credentials from "credentials.csv": ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        }
        let _param = configGet('region');
        if (_param == null) {
            log(`Param "region" is not defined in "serverless.json"`, 'error');
            return;
        }
        //OSLL: Prepare AWS interface configuration.
        _config = new AWS.Config({
            accessKeyId: credentials['Access key ID'],
            secretAccessKey: credentials['Secret access key'],
            region: _param,
            apiVersions: {
                cloudformation: '2010-05-15',
                s3: '2006-03-01'
            }
        });

        AWS.config.update(_config);
        s3 = new AWS.S3(); //OSLL: prepare the s3 interface with new credentials.

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

    let _bucket = {};
    _gen = _createBucket(_config.region, (error, bucket) => {
        if (error != undefined) {
            log(`> ERROR > creating bucket: ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        } else {
            configSet('bucketName', bucket.name);
            configSet('bucketUri', bucket.uri);
            _bucket = bucket;
            _gend.next();
        }
    });
    _gen.next(); //OSLL: Activates '_createBucket()' generator.
    yield;

    _gen = _populateBucket(_bucket, (error) => {
        if (error != undefined) {
            log(`> ERROR > populating bucket: ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        } else {
            _gend.next();
        }
    });
    _gen.next(); //OSLL: Activates '_populateBucket()' generator.
    yield;

    log(`> Wait for s3...`, 'info');
    setTimeout(() => {
        _gend.next();
    }, 1000);
    yield;

    let _args = {
        name: _bucket.name,
        bucket: _bucket.uri,
        parameters: [{
                ParameterKey: 'launchName',
                ParameterValue: _bucket.name,
                UsePreviousValue: false
            },
            {
                ParameterKey: 'adminEmail',
                ParameterValue: configGet('email'),
                UsePreviousValue: false
            }
        ]
    };

    _gen = _launchFormation(_args, (error) => {
        if (error != undefined) {
            log(`> ERROR > launching CloudFormation stack: ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        } else {
            _gend.next();
        }
    });
    _gen.next(); //OSLL: Activates '_launchFormation()' generator.
    yield;

    callback(); //OSLL: Success!
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
        //ACL: 'public-read',
        CreateBucketConfiguration: {
            LocationConstraint: region
        }
    };

    log(`> Setting up a new s3 bucket "${_bucket}"`, 'info');
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
 * Uploads the lesslms sources to the s3 bucket.
 * @generator
 * @param {object} bucket s3 bucket data where perform the uploads.
 * @callback cbk
 */

/**
 * Called on completion.
 * @param {cbk} callback Error first callback.
 */
function* _populateBucket(bucket, callback) {
    log(`> Prepare file list for uploading...`, 'info');

    //OSLL: Get top level structure of source directory. Only 2 levels are expected to use.
    let _upload = [];
    let _l1Path = path.join(_path, 'aws');
    let _l1 = fs.readdirSync(_l1Path, { withFileTypes: true });
    for (let i of _l1) {
        //OSLL: Get the contents of second level and push to upload quewe...
        if (i.isDirectory() == true) {
            let _l2Path = path.join(_path, 'aws', i.name);
            let _l2 = fs.readdirSync(_l2Path, { withFileTypes: true });
            for (let t of _l2) {
                if (t.isFile() == true) {
                    t.path = path.join(_l2Path, t.name);
                    t.bucket = `${bucket.name}/${i.name}`;
                    t.key = t.name;
                    _upload.push(t);
                    log(`> File added to upload quewe: "${t.path}"`, 'info');
                }
            }
        }
    }

    let _params = {};
    for (let b of _upload) {
        let _buffer = fs.readFileSync(b.path);
        _params = {
            Body: _buffer,
            Bucket: b.bucket,
            Key: b.key
        };

        debugger;
        s3.putObject(_params, (error, data) => {
            if (error) {
                _gen.return(false); //OSLL: Error!
                callback(error);
            } else {
                log(`> File uploaded success: "${b.bucket}/${b.key}"`, 'info');
                _gen.next();
            }
        });
        yield;
    }
    callback(null); //OSLL: Success!
}

/**
 * Launches the CloudFormation script.
 * @generator
 * @param {string} region AWS region where create the new bucket.
 * @callback cbk
 */

/**
 * Called on completion.
 * @param {object} args Arguments for CloudFormation launch.
 * @param {cbk} callback Error first callback.
 */
function* _launchFormation(args, callback) {
    log(`> Launching CloudFormation script... `, 'info');
    let _params = require('./formationParameters');
    _params.StackName = args.name;
    _params.Parameters = args.parameters;
    _params.TemplateURL = `${args.bucket}formation/lesslms.template.json`;
    log(`> CloudFormation using template at: "${_params.TemplateURL}" `, 'info');
    cf = new AWS.CloudFormation();
    cf.createStack(_params, (error, data) => {
        if (error) {
            _gen.return(false); //OSLL: Error!
            callback(error);
        } else {
            log(`> CloudFormation process launched: "${data.StackId}" `, 'info');
            log(`> Be patient, it will take a couple of minutes... `, 'info');
            _wait_g.t = 0;
            _wait_g.s = new spinner('Waiting for CloudFormation...', ['|', '/', '-', '\\', '-']);
            _wait_g.s.start();
            _launchFormationPooler(data.StackId, (error, result) => {
                if (error) {
                    _gen.return(false); //OSLL: Error!
                    callback(error);
                } else {
                    log(`> CloudFormation process finished with status: "${result.status}" `, 'info');
                    log(`> CloudFormation process finished with output: "${JSON.stringify(result.output,null,4)}" `, 'info');

                    _gen.return(true); //OSLL: Success!
                    callback();
                }
            });
        }
    });
    yield;
}

/**
 * Helper function to retrieve the creation status of a CloudFormation stack.
 * @function
 * @param {string} stackId StackId to retrieve status.
 * @callback cbk
 */

/**
 * Called on completion.
 * @param {cbk} callback Error first callback.
 */
function _launchFormationPooler(stackId, callback) {
    _timer_g = setTimeout(() => {
        let _params = {
            StackName: stackId
        };
        cf.describeStacks(_params, (error, data) => {
            if (error) {
                _gen.return(false); //OSLL: Error!
                callback(error);
            } else {
                //OSLL: This prevents nested re-triggerings...
                clearTimeout(_timer_g);
                let _result = {
                    status: data.Stacks[0].StackStatus,
                    output: data.Stacks[0].Outputs
                }
                _wait_g.s.message(`[${_wait_g.t++}s] CloudFormation status is: ${_result.status}`);
                debugger;
                switch (_result.status) {
                    case "CREATE_COMPLETE":
                    case "DELETE_COMPLETE":
                    case "UPDATE_COMPLETE":
                        _wait_g.s.stop();
                        callback(null, _result);
                        break;

                    case "CREATE_IN_PROGRESS":
                    case "ROLLBACK_IN_PROGRESS":
                    case "DELETE_IN_PROGRESS":
                    case "REVIEW_IN_PROGRESS":
                    case "UPDATE_IN_PROGRESS":
                    case "UPDATE_ROLLBACK_IN_PROGRESS":
                    case "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS":
                    case "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS":
                    default:
                        _launchFormationPooler(stackId, callback);
                        break;

                    case "CREATE_FAILED":
                    case "DELETE_FAILED":
                    case "ROLLBACK_FAILED":
                    case "ROLLBACK_COMPLETE":
                    case "UPDATE_ROLLBACK_COMPLETE":
                    case "UPDATE_ROLLBACK_FAILED":
                        _wait_g.s.stop();
                        callback({ error: data.Stacks[0].StackStatus, reason: data.Stacks[0].StackStatusReason });
                        break;

                }
            }
        });
    }, 1000);
}

module.exports = _main;