/**
 * @file lesslms-cli tool for serverless application deployment in AWS.
 * @author Oscar Sanz <osanzl@uoc.edu>
 * @module lib/cfpTemplate
 * @license MIT
 */

/**
 * Template object for cloudformation.createStack(..) call.
 * @object
 */
let _params = {
    StackName: 'STRING_VALUE',
    /* required */
    Capabilities: [
        'CAPABILITY_IAM'
        /* CAPABILITY_IAM | CAPABILITY_NAMED_IAM | CAPABILITY_AUTO_EXPAND, */
        /* more items */
    ],
    /*
    ClientRequestToken: 'STRING_VALUE',
        DisableRollback: false,
    */
    /*true || false,*/
    EnableTerminationProtection: false,
    /*true || false,*/
    /*
    NotificationARNs: [
        'STRING_VALUE',        
    ],
    */
    OnFailure: 'ROLLBACK',
    /*DO_NOTHING | ROLLBACK | DELETE,*/
    Parameters: [
        /*
        {
            ParameterKey: 'STRING_VALUE',
            ParameterValue: 'STRING_VALUE',
            ResolvedValue: 'STRING_VALUE',
            UsePreviousValue: true || false
        },
        */
        /* more items */
    ],
    /*
    ResourceTypes: [
        'STRING_VALUE',        
    ],
    */
    /*RoleARN: 'STRING_VALUE',*/
    /*
    RollbackConfiguration: {
        MonitoringTimeInMinutes: 'NUMBER_VALUE',
        RollbackTriggers: [{
                Arn: 'STRING_VALUE',
    
                Type: 'STRING_VALUE' 
            },
        ]
    },
    */
    /*
    StackPolicyBody: 'STRING_VALUE',
    StackPolicyURL: 'STRING_VALUE',
    */
    Tags: [{
            Key: 'lesslms',
            /* required */
            Value: 'lesslms automated formation version 15.04.2019' /* required */
        },
        /* more items */
    ],
    //TemplateBody: 'STRING_VALUE',
    TemplateURL: 'STRING_VALUE',
    TimeoutInMinutes: 30
};

module.exports = _params;