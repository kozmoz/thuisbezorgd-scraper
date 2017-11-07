
NPM Documentation
================= 
http://www.anupshinde.com/posts/how-to-create-nodejs-npm-package/



main is a module ID that is the primary entry point to our program. 
In our example, our package is named thuisbezorgd. After a user installs it, 
and then does require("thuisbezorgd"), then our main module's exports object 
will be returned.

bin We'd like to execute our package via command line from anywhere and 
therefore installed into the PATH. npm makes this pretty easy. On install, 
npm will symlink the bin/thuisbezorgd file for global installs, or to 
./node_modules/.bin/ for local installs.



JavaScript Standard Style 
=========================
https://github.com/standard/standard
