// doc at

https://docs.uploadthing.com/api-reference/ut-api

UTApi
The UploadThing API Helper, for use ON YOUR SERVER. It's basically just a REST API but better.

Please note that external API calls will almost always be slower than querying your own database. We recommend storing the file data you need in your own database, either in .onUploadComplete() or after uploading files using uploadFiles(), instead of relying on the API for your application's core data flow.

Since 5.7
Constructor
Prior to v5.7, the UTApi was exported as an object called utapi without any custom intialization support.

To get started, initialize an instance of UTApi.

~/server/uploadthing.ts
import { UTApi } from "uploadthing/server";
export const utapi = new UTApi({
  // ...options,
});

Copy
Copied!
Options
You can configure the SDK either by passing them as options to the constructor, or by setting them as environment variables. Environment variables follow the naming convention of UPLOADTHING_<NAME> ,where <NAME> is the name of the config option in constant case, e.g. UPLOADTHING_LOG_LEVEL. If both are set, the config object takes precedence.

Name
fetch
Type
FetchEsque
Since 5.7
Description
Provide a custom fetch function.

Name
token
Type
string
Default: env.UPLOADTHING_TOKENSince 7.0
Description
Your UploadThing token. You can find this on the UploadThing dashboard.

Name
logLevel
Type
Error | Warning | Info | Debug | Trace
Default: InfoSince 7.0
Description
Enable more verbose logging.
If using an older version of the SDK, levels might vary.

Name
logFormat
Type
json | logFmt | structured | pretty
Default: pretty in development, else jsonSince 7.1
Description
What format log entries should be in. Read more about the log formats here ↗.

Name
defaultKeyType
Type
'fileKey' | 'customId'
Since 6.4
Description
Set the default key type for file operations. Allows you to set your preferred filter for file keys or custom identifiers without needing to specify it on every call.

Name
apiUrl
Type
string
Since 7.0
Description
The URL of the UploadThing API. Defaults to https://api.uploadthing.com.

This option should only be set for self-hosted instances or for testing.

Name
ingestUrl
Type
string
Since 7.0
Description
The URL of the UploadThing Ingest API. Will be decoded from the token if not specified.

This option should only be set for self-hosted instances or for testing.

method
Since 5.3
uploadFiles
Upload files directly from your server without using the file router. Useful for server-side file processing, uploading from a server action, and much more.

import { utapi } from "~/server/uploadthing.ts";
async function uploadFiles(formData: FormData) {
  "use server";
  const files = formData.getAll("files");
  const response = await utapi.uploadFiles(files);
  //    ^? UploadedFileResponse[]
}
function MyForm() {
  return (
    <form action={uploadFiles}>
      <input name="files" type="file" multiple />
      <button type="submit">Upload</button>
    </form>
  );
}

Copy
Copied!
When uploading files using uploadFiles, the files must be present on your server. Then presigned URLs are generated on our servers before the files can be uploaded to the storage provider.

Parameters
Name
files
Type
MaybeArray<FileEsque>
RequiredSince 5.3
Description
The files to upload

// FileEsque is a blob with a name:
interface FileEsque extends Blob {
  name: string
  customId?: string
}
// For Node.js > 20, File is a global Class
File;
// or use UTFile which satisfies the File interface
// and allows passing in a customId
import { UTFile } from 'uploadthing/server'

Copy
Copied!
Name
opts.metadata
Type
Json
Since 5.3
Description
Metadata to be added to the uploaded files. This is useful for adding additional information to the files that can be used later.

Name
opts.contentDisposition
Type
inline | attachment
Default: inlineSince 5.3
Description
The content disposition to set on the storage provider. Content disposition indicates how the file is expected to be displayed in the browser. Read more about content disposition on MDN ↗.

Name
acl
Type
public-read | private
Since 6.0
Description
What ACL should be set on the storage provider. Default value is configured on your app settings and can only be used if the app allows per-request overrides.

Name
concurrency
Type
number
Default: 1Since 7.6.1
Description
The number of files to upload concurrently. Must be a positive integer between 1 and 25.

Returns
Returns an Option of UploadedFileResponse. If the files argument is an array, the returned value will also be an array.

type UploadFileResponse =
  | { data: UploadData; error: null }
  | { data: null; error: UploadError };
type UploadData = {
  key: string;
  url: string;
  name: string;
  size: number;
};
type UploadError = {
  code: string;
  message: string;
  data: any;
};

Copy
Copied!
method
Since 5.3
uploadFilesFromUrl
Have a file hosted somewhere else you want to upload on UploadThing? This is the function you're looking for.

When uploading files from URL, the file is first downloaded on your server, before presigned URLs are created and the file is uploaded to the storage provider.

import { utapi } from "~/server/uploadthing.ts";
const fileUrl = "https://test.com/some.png";
const uploadedFile = await utapi.uploadFilesFromUrl(fileUrl);
//    ^? UploadedFileResponse
const fileUrls = ["https://test.com/some.png", "https://test.com/some2.png"];
const uploadedFiles = await utapi.uploadFilesFromUrl(fileUrls);
//    ^? UploadedFileResponse[]

Copy
Copied!
Parameters
The first argument are the URLs of the files you want to upload. They may also be an object with a url property in case you want to override the name, or set a customId for the files. The function also takes some optional options:

Name
urls
Type
MaybeArray<MaybeURL | URLWithOverrides>
RequiredSince 5.3
Description
Metadata to be added to the uploaded files. This is useful for adding additional information to the files that can be used later.

type MaybeURL = string | URL
type URLWithOverrides = { url: MaybeURL; name?: string; customId?: string }

Copy
Copied!
Name
opts.metadata
Type
Json
Since 5.3
Description
Metadata to be added to the uploaded files. This is useful for adding additional information to the files that can be used later.

Name
opts.contentDisposition
Type
inline | attachment
Default: inlineSince 5.3
Description
The content disposition to set on the storage provider. Content disposition indicates how the file is expected to be displayed in the browser. Read more about content disposition on MDN ↗.

Name
opts.acl
Type
public-read | private
Default: inlineSince 6.0
Description
What ACL should be set on the storage provider. Default value is is configured on your app settings and can only be used if the app allows per-request overrides.

Name
concurrency
Type
number
Default: 1Since 7.6.1
Description
The number of files to upload concurrently. Must be a positive integer between 1 and 25.

Returns
Same as uploadFiles

method
Since 4.0
deleteFiles
deleteFiles takes in a fileKey or an array of fileKeys and deletes them from the server.

import { utapi } from "~/server/uploadthing.ts";
await utapi.deleteFiles("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
await utapi.deleteFiles([
  "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
  "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg",
]);
await deleteFiles("myCustomIdentifier", { keyType: "customId" });

Copy
Copied!
Parameters
Pass in the key(s) you want to delete as the first argument. Additionally, you may pass some options as a second argument:

Name
keys
Type
MaybeArray<string>
Required
Description
The fileKeys (or customIds) you want to delete

Name
opts.keyType
Type
fileKey | customId
Default: fileKeySince 6.4
Description
The type of key you are passing in.

Returns
object

method
Since 4.0
DEPRECATED
getFileUrls
getFileUrls takes in a fileKey or an array of fileKeys and returns the URLs to access them.

This method is deprecated and will be removed in a future version. Please refer to Accessing Files to learn how to access your files without extra roundtrips for API calls.

import { utapi } from "~/server/uploadthing.ts";
const oneUrl = await utapi.getFileUrls(
  "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
);
const multipleUrls = await utapi.getFileUrls([
  "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
  "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg",
]);

Copy
Copied!
Parameters
Pass in the key(s) you want to get the URLs for as the first argument. Additionally, you may pass some options as a second argument:

Name
keys
Type
MaybeArray<string>
Required
Description
The fileKeys (or customIds) you want to get the URLs for

Name
opts.keyType
Type
fileKey | customId
Default: fileKeySince 6.4
Description
The type of key you are passing in.

Returns
object

method
Since 5.3
listFiles
listFiles returns a paginated list of objects containing file ids and keys for all files that have been uploaded to the application your API key corresponds to.

We do not recommend using this as your primary data source. Instead, we recommend storing the file metadata (key, url, etc) in your database. This will reduce latency as well as support any query your application might need. The listFiles method is best suited for administrative tasks, one-time data synchronization, or debugging purposes.

import { utapi } from "~/server/uploadthing.ts";
const files = await utapi.listFiles();

Copy
Copied!
Parameters
Name
opts.limit
Type
number
Default: 500Since 6.1
Description
The maximum number of files to return

Name
opts.offset
Type
number
Default: 0Since 6.1
Description
The number of files to skip

Returns
object

method
Since 5.3
renameFiles
Rename a file or a list of files. You may specify either a file key or a custom id.

import { utapi } from "~/server/uploadthing.ts";
await utapi.renameFiles({
  fileKey: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
  newName: "myImage.jpg",
});
await utapi.renameFiles({
  customId: "my-identifier",
  newName: "myImage.jpg",
});
await utapi.renameFiles([
  {
    fileKey: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
    newName: "myImage.jpg",
  },
  {
    fileKey: "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg",
    newName: "myOtherImage.jpg",
  },
]);

Copy
Copied!
Returns
object

method
Since 7.5
generateSignedURL
Generate a presigned URL for a private file.

import { utapi } from "~/server/uploadthing.ts";
const fileKey = "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg";
const url = await utapi.generateSignedURL(fileKey, {
  expiresIn: 60 * 60, // 1 hour
  // expiresIn: '1 hour',
  // expiresIn: '3d',
  // expiresIn: '7 days',
});

Copy
Copied!
Unlike getSignedURL, this method does not make a fetch request to the UploadThing API and is the recommended way to generate a presigned URL for a private file.

Parameters
Name
key
Type
string
RequiredSince 7.5
Description
The key of the file to get a signed URL for

Name
options.expiresIn
Type
number | TimeString
Since 7.5
Description
Options for the signed URL. The parsed duration cannot exceed 7 days (604 800).

TimeString refers to a human-readable string that can be parsed as a number, followed by a unit of time. For example, 1s, 1 second, 2m, 2 minutes, 7 days etc. If no unit is specified, seconds are assumed.

Returns
{ ufsUrl: string }

method
Since 6.2
getSignedURL
Retrieve a signed URL for a private file. This method is no longer recommended as it makes a fetch request to the UploadThing API which incurs additional, unnecessary latency. Use generateSignedURL instead.

import { utapi } from "~/server/uploadthing.ts";
const fileKey = "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg";
const url = await utapi.getSignedURL(fileKey, {
  expiresIn: 60 * 60, // 1 hour
  // expiresIn: '1 hour',
  // expiresIn: '3d',
  // expiresIn: '7 days',
});

Copy
Copied!
The expiresIn option can only be used if you allow overrides in your app settings on the UploadThing dashboard.

Parameters
Name
key
Type
string
RequiredSince 6.2
Description
The key of the file to get a signed URL for

Name
options.expiresIn
Type
number | TimeString
Since 6.2
Description
Options for the signed URL. The parsed duration cannot exceed 7 days (604 800).

TimeString refers to a human-readable string that can be parsed as a number, followed by a unit of time. For example, 1s, 1 second, 2m, 2 minutes, 7 days etc. If no unit is specified, seconds are assumed.

Name
options.keyType
Type
customId | fileKey
Default: fileKeySince 6.2
Description
The type of key to use for the signed URL.

Returns
{ url: string, ufsUrl: string }

method
Since 6.8
updateACL
Update the ACL of a file or a list of files.

import { utapi } from "~/server/uploadthing.ts";
// Make a single file public
await utapi.updateACL(
  "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
  "public-read",
);
// Make multiple files private
await utapi.updateACL(
  [
    "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
    "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg",
  ],
  "private",
);

Copy
Copied!
Name
keys
Type
MaybeArray<string>
RequiredSince 6.8
Description
The fileKeys (or customIds) you want to update the ACL for

Name
acl
Type
public-read | private
RequiredSince 6.8
Description
The ACL to update to.

Name
opts.keyType
Type
fileKey | customId
Default: fileKeySince 6.8
Description
The type of key you are passing in.

Returns
object