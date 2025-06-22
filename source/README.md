To build in source/ dir:
Install dependencies ```npm install```
Run ```npm run build```
Files are all located in the build directory, and can be copied to the required place. 
Any changes not in the build directory (i.e. icons, logos) also require a recompile to take effect

The code is written in React, and can be found in App.js, changes can be made in there. Any
styling changes can be made in App.css
To test locally, running ```npm run start``` after having run ```npm i``` will start a local 
version of the code (given that these commands are run in the source/ directory).

Then when built the directory will be in build/ and can be copied out to where github will automatically
find it.