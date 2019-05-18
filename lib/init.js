/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz Llopis <osanzl@uoc.edu>
 * @module lib/init
 * @license MIT
 */
const fs = require('fs');
const path = require('path');
const process = require('process');
const inquirer = require('inquirer');
const log = require('../src/common').log;
const _path = path.join(process.cwd(), 'serverless');

/**
 * Entry point for lib/init module.
 * @function
 */
function _main() {
    log('> lesslms init...', 'info');
    _buildTree();
    _setupMenu();
}

/**
 * Creates the required folder structure for lesslms-cli.
 * @function
 */
function _buildTree() {
    log(`> Check for existing ${_path} folder...`, 'info');
    _rmdirSync(_path);

    log(`> Creating ${_path} folder...`, 'info');
    setTimeout(() => {
        //OSLL: <TO-IMPROVE> For some reason in windows a folder can't be recreated inmeditely after deleting it        
        //       if that folder already contained files and folders. </TO-IMPROVE>
        fs.mkdirSync(_path)
    }, 100);
}

/**
 * Launches the interactive menu for serverless.json building.
 * @function
 */
function _setupMenu() {
    inquirer.prompt(_questions_region)
        .then(answers => {
            if (answers.done == false) {
                log(`> Aborted by user, "./serverless.json" not saved.`, 'error');
                log(`> End.`, 'error');
            } else {
                answers.done = undefined;
                fs.writeFileSync(path.join(process.cwd(), 'serverless.json'),
                    JSON.stringify(answers, null, 4));

                log(`> "./serverless.json" saved to disk.`, 'info');
                log(` `, 'info');
                log(`> Please copy your "credentials.csv" file into "./serverless/" folder before continue.`, 'warning');
                log(`> Then run "lesslms deploy." `, 'warning');
            }
            //log('ANSWERS:' + JSON.stringify(answers));
        });
}

/**
 * Fetches the zipped lambda functions from repository.
 * @function
 * @_path {string} _path Helper function to delete non empty folders.
 */
function _rmdirSync(_path) {
    try {
        if (fs.statSync(_path).isDirectory() == false) {
            return;
        }
    } catch (e) {
        return;
    }

    let _list = fs.readdirSync(_path);
    for (var i = 0; i < _list.length; i++) {
        var filename = path.join(_path, _list[i]);
        var stat = fs.statSync(filename);

        if (filename == "." || filename == "..") {} else if (stat.isDirectory()) {
            _rmdirSync(filename);
            log(` > Removing dir....$ { filename }
                            `, 'info');
        } else {
            fs.unlinkSync(filename);
            log(` > Removing file...$ { filename }
                            `, 'info');
        }
    }
    fs.rmdirSync(_path);
}

let _questions_region = [{
        type: 'input',
        name: 'name',
        message: 'Enter a name for your lms instance:',
        default: 'my-lesslms'
    },
    {
        type: 'input',
        name: 'email',
        message: 'Enter a valid administrator email address:',
        validate: (input) => {
            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(input).toLowerCase());
        }
    },
    {
        type: 'list',
        name: 'region',
        message: 'Which is your AWS region?',
        choices: ['ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',
            'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'us-east-1', 'us-east-2',
            'us-west-2'
        ]
    },
    /* TODO	
        {
            type: 'confirm',
            name: 'sample',
            message: 'Do you want to populate your lms with sample content?',
            default: true
        },
    */
    {
        type: 'confirm',
        name: 'done',
        message: 'Is all this configuration correct?',
        default: true
    },
];

module.exports = _main;