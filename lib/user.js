/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz Llopis <osanzl@uoc.edu>
 * @module lib/user
 * @license MIT
 */

const AWS = require('aws-sdk');
const inquirer = require('inquirer');
const log = require('../src/common').log;
const configGet = require('../src/common').configGet;
const getCredentials = require('../src/common').getCredentials;
/**
 * Variable to store AWS config.
 * @var
 */
let _config = {};

/**
 * Entry point for lib/init module.
 * @function
 */
function _main() {
    _setupMenu((answers) => {
        switch (answers.command) {
            case 'add_user':
                _userAdd(answers);
                break;

            case 'delete_user':
                _userDelete(answers);
                break;

            default:
                break;
        }
    });
}

/**
 * Launches the interactive menu for lesslms user management.
 * @function
 */
function _setupMenu(callback) {
    log('> Getting credentials...', 'info');
    getCredentials((error, credentials) => {
        if (error != undefined) {
            log(`> ERROR > getting credentials from "credentials.csv": ${JSON.stringify(error)}`, 'error');
        }
        let _param = configGet('region');
        if (_param == null) {
            log(`Param "region" is not defined in "serverless.json"`, 'error');
            return;
        }

        _config = new AWS.Config({
            accessKeyId: credentials['Access key ID'],
            secretAccessKey: credentials['Secret access key'],
            region: _param,
            apiVersions: {
                cognitoidentityserviceprovider: '2016-04-18'
            }
        });
        AWS.config.update(_config);

        inquirer.prompt(_questions)
            .then(answers => {
                if (answers.done == false) {
                    log(`> Aborted by user, end.`, 'error');
                } else {
                    callback(answers);
                }
                //log('ANSWERS:' + JSON.stringify(answers));
            });

    });
}

function _userAdd(answers) {
    let cognitoPool = configGet('cognitoPool');
    let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

    let params = {
        UserPoolId: cognitoPool.UserPoolId,
        Username: answers.email,
        DesiredDeliveryMediums: ['EMAIL'],
        ForceAliasCreation: false,
        MessageAction: 'SUPPRESS',
        TemporaryPassword: answers.password,
        UserAttributes: [{
            Name: 'profile',
            Value: answers.profile
        }],
        /* 
        ValidationData: [{
                Name: 'STRING_VALUE',
                
                Value: 'STRING_VALUE'
            },           
        ]
        */
    };
    log('> lesslms adding new user: ' + answers.email, 'info');
    cognitoidentityserviceprovider.adminCreateUser(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
    });
}



function _userDelete(answers) {

}

let _questions = [{
        type: 'list',
        name: 'command',
        message: 'You want to...',
        choices: ['add_user', 'delete_user'],
        default: 'add_user'
    },
    {
        type: 'input',
        name: 'email',
        message: 'Enter a valid user email address (min 6 character length):',
        validate: (input) => {
            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(input).toLowerCase());
        },
        default: '@gmail.com'
    },
    {
        type: 'input',
        name: 'password',
        message: 'Enter new user password:',
        default: '123456'
    },
    {
        type: 'input',
        name: 'name',
        message: 'Enter new user full name:',
        default: 'Full Name'
    },
    {
        type: 'list',
        name: 'profile',
        message: 'Which is the user profile?',
        choices: ['editor', 'attendant'],
        default: 'editor'
    },
    {
        type: 'confirm',
        name: 'done',
        message: 'Is all this configuration correct?',
        default: true
    }
];

module.exports = _main;