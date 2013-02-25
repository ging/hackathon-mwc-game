var express = require ('express');
var net = require('net');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.configure(function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.logger());
    app.use(express.static(__dirname + '/client/'));

});

io.set('log level', 1);

server.listen (3004);

var players = {};
var seqNum = 0;

io.sockets.on('connection', function (socket) {

    console.log("Socket connect ", socket.id);

    socket.on('initConnection', function (callback) {

        if (Object.keys(players).length < 2) {

        	players[socket.id] = 0;
        	console.log('connected player ', Object.keys(players).length);
        	callback('success', socket.id, Object.keys(players).length);

        	if (Object.keys(players).length === 2) {
        		sendRes(true);

        	};

        } else {
        	console.log('Full');
        	callback('error');
        }

    });

    socket.on('yeah', function (sN) {

    	console.log(sN);

    	players[socket.id] ++;
    	console.log('POINT', players);

    	if (sN === seqNum) {

	    	seqNum ++;

	    	sendRes(false);
	    }

    });

    socket.on('sdp', function (msg) {

        var keys = Object.keys(players);

        for (var i = 0; i < 2; i++) {
            if (players[keys[i]] !== socket.id) {
                io.sockets.socket(keys[i]).emit('sdp', msg);
            }
        }

    });

    socket.on('disconnect', function () {



    	delete players[socket.id];

    	console.log('DIS', players);

    });

});

function sendRes (first) {

	var xo = randomFromInterval(0, 640 - 150);
	var yo = randomFromInterval(0, 480 - 150);

	console.log(xo,yo);

	var keys = Object.keys(players);

	//depende del numero de imagenes
	var res = randomFromInterval (1,4);

	io.sockets.socket(keys[0]).emit('showRes', {x: xo, y: yo, res: res, score: players, seqNum: seqNum, first: first});
    io.sockets.socket(keys[1]).emit('showRes', {x: xo, y: yo, res: res, score: players, seqNum: seqNum, first: first});

}

function randomFromInterval(from,to)
{
    return Math.floor(Math.random()*(to-from+1)+from);
}