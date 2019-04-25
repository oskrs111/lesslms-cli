/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz Llopis <osanzl@uoc.edu>
 * @module src/api
 * @license MIT
 */
const AWS = require('aws-sdk');
const log = require('../src/common').log;
const configGet = require('../src/common').configGet;
const getCredentials = require('../src/common').getCredentials;

/**
 * Variable to store AWS config.
 * @var
 */
let _config = {};
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
            apiVersion: '2018-11-29',
            s3: '2006-03-01'
        }
    });

    AWS.config.update(_config);

    let apigatewayv2 = new AWS.ApiGatewayV2();
    let params = {
        ApiId: '506jhgj1i2'
    };
    apigatewayv2.getApi(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
    });




});