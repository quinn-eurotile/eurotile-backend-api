const app = require("./app");


const http = require("http");
const port = process.env.PORT;
const routes = require('./routes/index');
console.log('routes comming')
const models = require('./models/index');

const server = http.createServer(app);

// server listening 
server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

app.use('/', routes);
