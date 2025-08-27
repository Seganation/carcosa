// doc at

https://docs.uploadthing.com/api-reference/server


UploadThing Server
Server bindings for UploadThing.

function
Since 5.0
createUploadthing
The helper function to create an UploadThing instance. MAKE SURE YOU IMPORT IT FROM THE RIGHT PLACE. The export name ensures your file routes' middleware functions are typed correctly.

Next App Router
Next Pages Dir
SolidJS
Express
Fastify
H3
import { createUploadthing, type FileRouter } from "uploadthing/next";
const f = createUploadthing();
export const uploadRouter = {  };
// ...
f({  })
  .middleware(({ req }) => {
    //           ^? req: NextRequest
    return {}
  })

Copy
Copied!
function
Since 6.3
createRouteHandler
All adapters exports a createRouteHandler function that exposes your router to the world. By default, you should only have to pass your router to this function, although there are some extra configuration options available.

The names of the exported createRouteHandler is different prior to v6.3.

Next App Router
Next Pages Dir
SolidJS
Express
Fastify
H3
Remix
import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "~/server/uploadthing.ts";
export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  // config: { ... },
});

Copy
Copied!
Config Parameters
You can configure the route handler either by passing a config object to the createRouteHandler function, or by setting them as environment variables. Environment variables follows the naming convention of UPLOADTHING_<NAME> ,where <NAME> is the name of the config option in constant case, e.g. UPLOADTHING_LOG_LEVEL. If both are set, the config object takes precedence.

Name
callbackUrl
Type
string
Since 6.0
Description
The full, absolute URL to where your route handler is hosted. This is called via webhook after your file is uploaded. UploadThing attempts to automatically detect this value based on the request URL and headers. You can override this if the automatic detection fails.

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
isDev
Type
boolean
Default: env.NODE_ENV === 'development'Since 6.3
Description
Used to determine whether to run dev hook or not

Name
fetch
Type
FetchEsque
Default: globalThis.fetchSince 6.3
Description
Used to override the fetch implementation

Name
ingestUrl
Type
string
Since 7.0
Description
The URL of the UploadThing Ingest API. Will be decoded from the token if not specified.

This option should only be set for self-hosted instances or for testing.

class
Since 5.7
UTApi
See UTApi

class
Since 6.4
UTFile
A helper class to construct File ↗ in environments that don't support it natively.

Also accepts a customId property to set a custom identifier for the file to be uploaded using UTApi.uploadFiles.

Constructor
Name
parts
Type
BlobPart[]
Required
Description
The parts of the file to be uploaded.

Name
name
Type
string
Required
Description
The name of the file to be uploaded.

Name
opts.type
Type
string
Since 6.4
Description
The type of the file to be uploaded.

Name
opts.customId
Type
string
Since 6.4
Description
A custom identifier for the file to be uploaded using UTApi.uploadFiles.

Name
opts.lastModified
Type
number
Since 6.4
Description
The last modified time of the file to be uploaded.

Example
import { UTApi, UTFile } from "uploadthing/server";
const utapi = new UTApi();
const file = new UTFile(["foo"], "foo.txt", { customId: "foo" });
const response = await utapi.uploadFiles([file]);

Copy
Copied!
