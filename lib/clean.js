/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz Llopis <osanzl@uoc.edu>
 * @module lib/clean
 * @license MIT
 */
const AWS = require('aws-sdk');
const inquirer = require('inquirer');
const log = require('../src/common').log;
const getCredentials = require('../src/common').getCredentials;
const configGet = require('../src/common').configGet;
const configSet = require('../src/common').configSet;

/**
 * Variable to store generator instances.
 * @var
 */
let _genc = {};

/**
 * Variable to store s3 instance.
 * @var
 */
let s3 = {};

/**
 * Entry point for lib/clean module.
 * @function
 */
function _main() {
    log('> lesslms clean...', 'info');
    _genc = _setupMenu((error, result) => {
        if (result == true) {
            _genc = _cleanup();
            _genc.next(); //OSLL: Activates '_cleanup(...)' generator.
        }
    });
    _genc.next(); //OSLL: Activates '_setupMenu(...)' generator.

}

/**
 * Launches the interactive menu to confirmation the cleaning job.
 * @function
 */
function* _setupMenu(callback) {
    inquirer.prompt(_questions_confirmation)
        .then(answers => {
            if (answers.done == false) {
                log(`> Aborted by user, end.`, 'error');
                log(`> End.`, 'error');
                _genc.return(false);
                callback(null, false);
            } else {
                answers.done = undefined;
                _genc.return(true);
                callback(null, true);
            }
        });
    yield;
}

/**
 * Perfoms the cleaning job.
 * @function
 */
function* _cleanup() {
    getCredentials((error, credentials) => {
        if (error != undefined) {
            log(`> ERROR > getting credentials from "credentials.csv": ${JSON.stringify(error)}`, 'error');
            _gend.return(false);
        }
        let _param = configGet('region');
        if (_param == null) {
            log(`Param "region" is not defined in "serverless.json"`, 'error');
            _genc.return(false);
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
        _genc.next();
    });
    yield;

    let params = {};
    let _buckets = [];
    s3.listBuckets(params, function(error, data) {
        if (error) {
            log(`> ERROR > listing buckets: ${JSON.stringify(error)}`, 'error');
            _genc.return(false);
        } else {
            log(`${data.Buckets.length} buckets found...`, 'info');
            _buckets = data.Buckets;
            _genc.next();
        }
    });
    yield;

    for (let b of _buckets) {
        if (b.Name.indexOf('lesslms') >= 0) {
            log(`Deleting "${b.Name}" bucket...`, 'info');
            params = {
                Bucket: b.Name
            };
            //OSLL: Buckets can't be deleted if are not empty...
            s3.listObjects(params, function(error, data) {
                if (error) {
                    log(`> ERROR > listing objects: ${JSON.stringify(error)}`, 'error');
                    _genc.return(false);
                } else {
                    for (let c of data.Contents) {
                        delete c.LastModified;
                        delete c.ETag;
                        delete c.Size;
                        delete c.StorageClass;
                        delete c.Owner;
                    }

                    params.Delete = {
                        Objects: data.Contents,
                        Quiet: false
                    }
                    log(`Listing bucket "${b.Name}" contents...`, 'info');
                    _genc.next();
                };
            });
            yield;

            if (params.Delete.Objects.length > 0) {
                //OSLL: Delete 'data.Contents' if there contents...                     
                s3.deleteObjects(params, function(error, data) {
                    if (error) {
                        log(`> ERROR > deleting objects: ${JSON.stringify(error)}`, 'error');
                        _genc.return(false);
                    } else {
                        log(`Bucket "${b.Name}" cleaned.`, 'info');
                        _genc.next();
                    }
                });
                yield;
            }

            delete params.Delete;
            s3.deleteBucket(params, function(error, data) {
                if (error) {
                    log(`> ERROR > deleting buckets: ${JSON.stringify(error)}`, 'error');
                    _genc.return(false);
                } else {
                    log(`Bucket "${b.Name}" deleted.`, 'info');
                    _genc.next();
                }
            });
            yield;
        }
    }

    /*
    var params = {
      NextToken: 'STRING_VALUE',
      StackStatusFilter: [
        CREATE_IN_PROGRESS | CREATE_FAILED | CREATE_COMPLETE | ROLLBACK_IN_PROGRESS | ROLLBACK_FAILED | ROLLBACK_COMPLETE | DELETE_IN_PROGRESS | DELETE_FAILED | DELETE_COMPLETE | UPDATE_IN_PROGRESS | UPDATE_COMPLETE_CLEANUP_IN_PROGRESS | UPDATE_COMPLETE | UPDATE_ROLLBACK_IN_PROGRESS | UPDATE_ROLLBACK_FAILED | UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS | UPDATE_ROLLBACK_COMPLETE | REVIEW_IN_PROGRESS,
      ]
    };
    cloudformation.listStacks(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
    */


    /*
    var params = {
      StackName: 'STRING_VALUE', 
      ClientRequestToken: 'STRING_VALUE',
      RetainResources: [
        'STRING_VALUE',    
      ],
      RoleARN: 'STRING_VALUE'
    };
    cloudformation.deleteStack(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
    */

}

let _questions_confirmation = [{
    type: 'confirm',
    name: 'clean',
    message: 'This command will delete all lesslms content in AWS, proceed?',
    default: false
}, ];

module.exports = _main;