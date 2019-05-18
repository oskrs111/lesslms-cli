# lesslms-cli
## Node.js CLI tool for serverless LMS (Learning Management System) automated deploy on AWS platform.

This cli tool provides full automated deplyment for *'lesslms'* server-less LMS application on Amazon Web Services. Source for deployment is automatically fetched from *'lesslms'* repository at https://github.com/oskrs111/lesslms

## Usage
1 - Create a develper account at: https://portal.aws.amazon.com/billing/signup#/start 

2 - Create a new user (IAM) and give to it **Programatic access**, with **AdministratorAccess** Policy. Download the **credentials.csv** file (remeber to keep it save).

3 - Get *'lesslms-cli'* from npm:
```javascript
$ npm install lesslms-cli -g
```

4 - And run:
```javascript
$ lesslms init
```
Follow the interactive menu instructions. On finish new **./serverless/** and **serverless.json** shoud be cerated on current folder.

5 - Copy **credentials.csv** file (got in step 2) inside **./serverless/**.

6 - Launch *'lesslms'* deployment:
```javascript
$ lesslms deploy
```
It can take some minutes to complete.

7 - When done, check your email for the administrative user password, created automatically during the deployment.

8 - Navigate to **./serverless/aws/client/** folder and run client app executable.

9 - When installed, run and fill login form with the provided email and received password, and get *API Gateway Uri* from **serverless.json**:

```javascript
{
    "name": "my-lesslms",
    "email": "your@email.com",
    "region": "eu-west-1",
    "sample": false,
    "bucketName": "lesslms-00000000000000",
    "bucketUri": "http://lesslms-00000000000000.s3.amazonaws.com/",
    "ApiGatewayUri": "https://00000000000000.execute-api.eu-west-1.amazonaws.com/less/",
    "cognitoPool": {"ClientId":"00000000000000","UserPoolId":"eu-west-1_00000000000000"}
}
```
10 - After Login, you can start to build your courses.





