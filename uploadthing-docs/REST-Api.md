// doc at 

https://docs.uploadthing.com/api-reference/openapi-spec




UploadThing REST API Specification
You can use the UploadThing REST API to build SDKs for languages and frameworks we don't natively support. The API is designed to be simple and easy to use. The latest version of all endpoints are documented here.

Server
Server:https://api.uploadthing.com
Production


Authentication
ApiKeyAuth Required

ApiKeyAuth
Name
:
x-uploadthing-api-key
Value
:
QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT
Client Libraries

Curl
Curl Shell

default​#Copy link to "default"

GET
/v6/pollUpload/:fileKey
​#Copy link to "
/v6/pollUpload/:fileKey
"
Copy endpoint URL

GET
/v6/serverCallback
​#Copy link to "
/v6/serverCallback
"
Copy endpoint URL

POST
/v6/serverCallback
​#Copy link to "
/v6/serverCallback
"
Copy endpoint URL

POST
/v6/prepareUpload
​#Copy link to "
/v6/prepareUpload
"
Copy endpoint URL

POST
/v6/uploadFiles
​#Copy link to "
/v6/uploadFiles
"
Copy endpoint URL

POST
/v6/completeMultipart
​#Copy link to "
/v6/completeMultipart
"
Copy endpoint URL

POST
/v6/listFiles
​#Copy link to "
/v6/listFiles
"
Copy endpoint URL

POST
/v6/renameFiles
​#Copy link to "
/v6/renameFiles
"
Copy endpoint URL

POST
/v6/deleteFiles
​#Copy link to "
/v6/deleteFiles
"
Copy endpoint URL

POST
/v7/getAppInfo
​#Copy link to "
/v7/getAppInfo
"
Copy endpoint URL

POST
/v6/getUsageInfo
​#Copy link to "
/v6/getUsageInfo
"
Copy endpoint URL

POST
/v6/failureCallback
​#Copy link to "
/v6/failureCallback
"
Copy endpoint URL

POST
/v6/requestFileAccess
​#Copy link to "
/v6/requestFileAccess
"
Copy endpoint URL

POST
/v6/updateACL
​#Copy link to "
/v6/updateACL
"
Copy endpoint URL

POST
/v7/prepareUpload
​#Copy link to "
/v7/prepareUpload
"

Test Request
(post /v7/prepareUpload)
Copy endpoint URL
