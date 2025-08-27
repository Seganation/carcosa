// doc at 

https://docs.uploadthing.com/api-reference/client


uploadthing/client
The UploadThing Client module provides utilities for working files in your application and communicating with your backend file router.

function
Since 5.0
uploadFiles
This function is used to perform client side uploads by requesting presigned URLs from your backend file router, and then uploading the files to the storage provider.

Use the genUploader factory function to generate a typed function that matches the signature of your file router, which will allow autocompletion and type checking on endpoint, route input and callback data types.

import { genUploader } from "uploadthing/client";
import type { UploadRouter } from "~/server/uploadthing";
export const { uploadFiles } = genUploader<UploadRouter>();
const response = await uploadFiles("routeEndpoint", {
  files: [],
});

Copy
Copied!
Parameters
The first parameter is the route endpoint to upload to, and the second parameter is an options object:

The endpoint arg may be a string literal or a callback function:

await uploadFiles((routeRegistry) => routeRegistry.routeEndpoint, { ... })

Copy
Copied!
Using a callback function allows Go to Defintion on routeEndpoint to take you straight to your backend file route definition, which is not possible when using a string literal parameter.

Name
files
Type
File[]
RequiredSince 5.0
Description
An array of files to upload.

Name
input
Type
TInput
Since 5.0
Description
Input JSON data matching your validator set on the FileRoute to send with the request.

Name
headers
Type
HeadersInit | () => HeadersInit
Since 5.1
Description
Headers to be sent along the request to request the presigned URLs. Useful for authentication outside full-stack framework setups.

Name
signal
Type
AbortSignal
Since 6.7
Description
An abort signal to abort the upload.

Name
onUploadBegin
Type
({ file: string }) => void
Since 5.4
Description
Callback function called after the presigned URLs have been retrieved, just before the file is uploaded. Called once per file.

Name
onUploadProgress
Type
({ file, progress }) => void
Since 6.4
Description
Callback function that gets continuously called as the file is uploaded to the storage provider.

Returns
The function returns a Promise that resolves to an array of objects:

Name
name
Type
string
Description
The name of the file.

Name
size
Type
number
Description
The size of the file in bytes.

Name
type
Type
string
Description
The type of the file.

Name
key
Type
string | null
Description
The file key of the file.

Name
url
Type
string
Description
The url of the file.

Name
customId
Type
string | null
Description
The custom id of the file, if provided on upload.

Name
serverData
Type
Generic
Description
The data returned from the onUploadComplete callback on the file route. This will be null if RouteOptions.awaitServerData isn't enabled.

function
Since 7.0
createUpload
Create a resumable upload. Resumable uploads allows you to start an upload, pause it, and then resume it at a later time. As long as the presigned URL is valid, you can continue the upload from where it left off.

As for uploadFiles, use the genUploader factory function to generate a typed function that matches the signature of your file router, which will allow autocompletion and type checking on endpoint, route input and callback data types.

Due to difficulties integrating with React Native's Blob implementation, resumable uploads are currently not supported on React Native.

import { genUploader } from "uploadthing/client";
import type { UploadRouter } from "~/server/uploadthing";
export const { createUpload } = genUploader<UploadRouter>();
// Create the upload. The files will start uploading immediately.
const { pauseUpload, resumeUpload, done } = createUpload("routeEndpoint", {
  files: [],
});
// Pause the upload of a file
pauseUpload(file);
// Resume the upload of a file
resumeUpload(file);
// Await the completion of all files
const files = await done();

Copy
Copied!
Parameters
The first parameter is the route endpoint to upload to, and the second parameter is an options object:

Name
files
Type
File[]
RequiredSince 7.0
Description
An array of files to upload.

Name
input
Type
TInput
Since 7.0
Description
Input JSON data matching your validator set on the FileRoute to send with the request.

Name
headers
Type
HeadersInit | () => HeadersInit
Since 7.0
Description
Headers to be sent along the request to request the presigned URLs. Useful for authentication outside full-stack framework setups.

Name
onUploadProgress
Type
(progress) => void
Since 7.0
Description
Callback function that gets continuously called as the file is uploaded to the storage provider.

Returns
Name
pauseUpload
Type
(file?: File) => void
Since 7.0
Description
Pause the upload of a file. If no file is provided, all files will be paused.

Name
resumeUpload
Type
(file?: File) => void
Since 7.0
Description
Resume the upload of a file. If no file is provided, all files will be resumed.

Name
done
Type
(file?: File) => Promise<MaybeArray<UploadedFileResponse>>
Since 7.0
Description
Await the completion of the upload of a file. If no file is provided, all files will be awaited. The returned object is the same as the one returned by uploadFiles. If a file is provided, the function returns an object, else it returns an array.

function
Since 6.0
generateClientDropzoneAccept
Generate an accepted object that can be passed to the accept prop of a useDropzone hook or Dropzone component.

Parameters
Name
fileTypes
Type
string[]
Required
Description
The route config to generate the accept props for.

Returns
object

function
Since 6.0
generateMimeTypes
Generate an array of accepted mime types given a route config.

Parameters
Name
config
Type
ExpandedRouteConfig
Required
Description
The route config to generate the accept props for.

Returns
string[]

function
Since 6.0
generatePermittedFileTypes
Utility function to generate accept props for a <input type="file"> element.

Parameters
Name
config
Type
ExpandedRouteConfig
Required
Description
The route config to generate the accept props for.

Returns
Name
fileTypes
Type
string[]
Description
The route config to generate the accept props for.

Name
multiple
Type
boolean
Description
Whether the accept props should be for multiple files.

function
Since 6.11
isValidSize
This function is used to validate that a file is of a valid size given a route config.

Parameters
Name
file
Type
File
Required
Description
The size of the file to validate.

Name
maxSize
Type
number
Required
Description
The maximum size of the file to validate.

Returns
boolean

function
Since 6.11
isValidType
This function is used to validate that a file is of a valid type given a route config.

Parameters
Name
file
Type
File
Required
Description
The type of the file to validate.

Name
allowedTypes
Type
string[]
Required
Description
The allowed types of the file to validate.

Returns
boolean