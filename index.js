const app = require("./app");
const port = process.env.PORT;
const routes = require('./routes/index');
const models = require('./models/index');
const http = require('http');
//const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const express = require('express');

const { SupportTicketMsg } = require('./models');
const { default: mongoose } = require("mongoose");

// const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '';
// const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '';

// let server;

// if (process.env.APP_URL?.startsWith('https://')) {
// 	try {
// 		if (!SSL_CERT_PATH || !SSL_KEY_PATH) {
// 			throw new Error("SSL paths not provided.");
// 		}

// 		const httpsOptions = {
// 			cert: fs.readFileSync(SSL_CERT_PATH),
// 			key: fs.readFileSync(SSL_KEY_PATH),
// 		};

// 		server = https.createServer(httpsOptions, app);
// 		// //console.log("HTTPS server created");
// 	} catch (error) {
// 		console.error("Error creating HTTPS server:", error.message);
// 		// //console.log("Falling back to HTTP server");
// 		server = http.createServer(app);
// 	}
// } else {
// 	server = http.createServer(app);
// 	// //console.log("HTTP server created");
// }

const server = http.createServer(app);


const allowedOrigins = [
	process.env.CLIENT_URL,
	process.env.CLIENT_URL_FOR_B2C
];

const io = socketIo(server, {
	cors: {
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: ['GET', 'POST']
	}
});

// const io = socketIo(server, {
// 	cors: {
// 		origin: process.env.CLIENT_URL,
// 		methods: ['GET', 'POST']
// 	}
// });

// Add this near the top of your file, after other middleware
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

io.on('connection', socket => {
	//console.log('Socket connected:', socket.id);

	socket.on('sendMessage', async (msg) => {

		try {
			const uploadDir = path.join(__dirname, '.', 'uploads', 'support-tickets', String(msg.ticketId));
			let fileData = null;

			// Handle file if present
			if (msg.hasImage && msg.image) {
				try {
					// Create upload directory if it doesn't exist
					if (!fs.existsSync(uploadDir)) {
						fs.mkdirSync(uploadDir, { recursive: true });
					}

					const ext = path.extname(msg.imageName).toLowerCase();
					let fileType = 'docs';

					// Determine file type based on extension
					if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
						fileType = 'image';
					} else if (['.mp4', '.webm', '.mov'].includes(ext)) {
						fileType = 'video';
					} else if (['.pdf'].includes(ext)) {
						fileType = 'pdf';
					}

					const timestampedName = `${Date.now()}_${msg.imageName}`;
					const fullPath = path.join(uploadDir, timestampedName);

					// Save file
					fs.writeFileSync(fullPath, msg?.image);

					// Prepare file data with correct URL path
					fileData = {
						fileName: msg.imageName,
						fileType,
						filePath: `/uploads/support-tickets/${msg.ticketId}/${timestampedName}`,
						fileSize: msg.imageSize
					};

					//console.log('File saved successfully:', fileData);
				} catch (fileError) {
					console.error('Error saving file:', fileError);
					throw new Error('Failed to save file');
				}
			}

			// Save message to database
			const savedMsg = await SupportTicketMsg.create({
				ticket: new mongoose.Types.ObjectId(String(msg.ticketId)),
				sender: new mongoose.Types.ObjectId(String(msg.senderId)),
				message: msg.content,
				...(fileData && fileData)
			});


			// Emit message to all clients in the ticket room
			io.to(msg.ticketId).emit('receiveMessage', {
				_id: savedMsg._id,
				ticket: savedMsg.ticket,
				sender: savedMsg.sender,
				message: savedMsg.message,
				fileName: savedMsg.fileName,
				fileType: savedMsg.fileType,
				filePath: savedMsg.filePath,
				fileSize: savedMsg.fileSize,
				createdAt: savedMsg.createdAt,
				sender_detail: msg.sender_detail
			});

		} catch (error) {
			console.error('Failed to save message:', error);
		}
	});

	/** Join By Ticket Id ***/
	socket.on("join", (requestData) => {
		//console.log("Join time requestData", requestData);
		socket.join(requestData.ticketId);
	});

	socket.on('disconnect', () => {
		//console.log('Socket disconnected:', socket.id);
	});
});

// server listening 
server.listen(port, () => {
	// //console.log(`Server running on port ${port}`);
});

app.use('/', routes);
