const http = require('http'),
	express = require('express'),
	socketIo = require('socket.io'),
	easyrtc = require('easyrtc'),
	livereload = require('livereload'),
	nunjucks = require('nunjucks');

// Set process name
process.title = 'node-easyrtc';

// Get port or default to 8080
const port = process.env.PORT || 8080;

// Setup livereload server.
const server = livereload.createServer({
	delay: 200
});
server.watch(__dirname + '/dist');
server.watch(__dirname + '/client/views');

// Setup and configure Express http server.
const app = express();

nunjucks.configure('client/views', {
	autoescape: true,
	express: app,
	watch: true
});

app.get('/', function(req, res) {
	res.render('index.html');
});


app.get('/test-2', function(req, res) {
	res.render('test-2.html');
});

app.use(express.static('dist'));
app.use('/assets', express.static('client/assets'));

// Start Express http server
var webServer = http.createServer(app);

// Start Socket.io so it attaches itself to Express server
// @ts-ignore
var socketServer = socketIo.listen(webServer, { 'log level': 1 });

var myIceServers = [
	{'url': 'stun:stun.l.google.com:19302'},
	{'url': 'stun:stun1.l.google.com:19302'},
	{'url': 'stun:stun2.l.google.com:19302'},
	{'url': 'stun:stun3.l.google.com:19302'}
	// {
	//   "url":"turn:[ADDRESS]:[PORT]",
	//   "username":"[USERNAME]",
	//   "credential":"[CREDENTIAL]"
	// },
	// {
	//   "url":"turn:[ADDRESS]:[PORT][?transport=tcp]",
	//   "username":"[USERNAME]",
	//   "credential":"[CREDENTIAL]"
	// }
];
easyrtc.setOption('appIceServers', myIceServers);
easyrtc.setOption('logLevel', 'debug');
easyrtc.setOption('demosEnable', false);

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on('easyrtcAuth', function(socket, easyRTCid, msg, socketCallback, callback) {
	easyrtc.events.defaultListeners.easyrtcAuth(socket, easyRTCid, msg, socketCallback, function(err, connectionObj) {
		if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
			callback(err, connectionObj);
			return;
		}

		connectionObj.setField('credential', msg.msgData.credential, {'isShared': false});

		console.log('[' + easyRTCid + '] Credential saved!', connectionObj.getFieldValueSync('credential'));

		callback(err, connectionObj);
	});
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on('roomJoin', function(connectionObj, roomName, roomParameter, callback) {
	console.log('[' + connectionObj.getEasyrtcid() + '] Credential retrieved!', connectionObj.getFieldValueSync('credential'));
	easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
	console.log('Initiated');

	rtcRef.events.on('roomCreate', function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
		console.log('roomCreate fired! Trying to create: ' + roomName);

		appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
	});
});

// listen on port
webServer.listen(port, function () {
	console.log('listening on http://localhost:' + port);
});
