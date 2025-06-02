const app = require("./app");
const port = process.env.PORT;
const routes = require('./routes/index');
console.log('routes comming');
const models = require('./models/index');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const { SupportTicketMsg } = require('./models');
const { default: mongoose } = require("mongoose");

const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '';

let server;

if (process.env.APP_URL?.startsWith('https://')) {
	try {
		if (!SSL_CERT_PATH || !SSL_KEY_PATH) {
			throw new Error("SSL paths not provided.");
		}

		const httpsOptions = {
			cert: fs.readFileSync(SSL_CERT_PATH),
			key: fs.readFileSync(SSL_KEY_PATH),
		};

		server = https.createServer(httpsOptions, app);
		console.log("HTTPS server created");
	} catch (error) {
		console.error("Error creating HTTPS server:", error.message);
		console.log("Falling back to HTTP server");
		server = http.createServer(app);
	}
} else {
	server = http.createServer(app);
	console.log("HTTP server created");
}

const io = socketIo(server, {
	cors: {
		origin: process.env.CLIENT_URL,
		methods: ['GET', 'POST']
	}
});

io.on('connection', socket => {
	console.log('Socket connected:', socket.id);

	socket.on('sendMessage', async  msg => {
		console.log('Message sendMessage:', msg);

		try {
			const parsedMsg = JSON.parse(msg); // or if msg is already a JSON object, skip this line

			// Save to database
			const savedMsg = await SupportTicketMsg.create({
				ticket: new mongoose.Types.ObjectId(String(parsedMsg.ticketId)),
				sender: new mongoose.Types.ObjectId(String(parsedMsg.senderId)),
				message: parsedMsg.content,
				fileName: null,
				fileType: null,
				filePath: null,
				fileSize:  0,
			});

			// Emit message (could use `savedMsg` with `_id` or other info if needed)
			io.to(parsedMsg.ticketId).emit('receiveMessage', JSON.stringify(savedMsg));
			//io.emit('receiveMessage', JSON.stringify(savedMsg));
		} catch (error) {
			console.error('Failed to save message:', error);
		}
	});

	/** Join By Ticket Id ***/
	socket.on("join", (requestData) => {
		console.log("requestData", requestData);
		
		socket.join(requestData.ticketId);
		
	});

	socket.on('disconnect', () => {
		console.log('Socket disconnected:', socket.id);
	});
});

// server listening 
server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

app.use('/', routes);
