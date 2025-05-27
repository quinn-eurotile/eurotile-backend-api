const app = require("./app");
const port = process.env.PORT;
const routes = require('./routes/index');
console.log('routes comming');
const models = require('./models/index');
const http = require('http');
const socketIo = require('socket.io');
const { SupportTicketMsg } = require('./models');

const server = http.createServer(app);

const io = socketIo(server, {
	cors: {
		origin: 'http://localhost:3000',
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
				ticket: parsedMsg.ticketId,
				sender: parsedMsg.senderId,
				message: parsedMsg.content,
				fileName: null,
				fileType: null,
				filePath: null,
				fileSize:  0,
			});

			// Emit message (could use `savedMsg` with `_id` or other info if needed)
			io.emit('receiveMessage', JSON.stringify(savedMsg));
		} catch (error) {
			console.error('Failed to save message:', error);
		}
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
