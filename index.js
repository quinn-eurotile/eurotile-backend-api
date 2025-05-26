const app = require("./app");
const port = process.env.PORT;
const routes = require('./routes/index');
console.log('routes comming');
const models = require('./models/index');
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);

const io = socketIo(server, {
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST']
	}
});

io.on('connection', socket => {
	console.log('Socket connected:', socket.id);

	socket.on('sendMessage', msg => {
		io.emit('receiveMessage', msg);
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
