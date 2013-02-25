var express = require("express"),	
   app = express.createServer(),
   io = require('socket.io').listen(app);
 app.configure(function () {
       "use strict";
       app.use(express.methodOverride());
       app.use(express.bodyParser());
       app.use(express.static(__dirname));
       app.use(express.errorHandler({
           dumpExceptions: true,
               showStack: true
       }));
   app.use(app.router);
});

 // To close the socket....
 //io.sockets.close();

app.listen(8080);
console.log("Listening on port 8080");