const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {
	let token =
		req.body?.token ||
		req.query?.token ||
		req.headers["x-access-token"] ||
		req.headers["authorization"];

	if (!token) {
		return res.status(200).send({
			type: 'failure',
			message: "An authorization token is required for user authentication"
		});
	}

	try {
		if (token.startsWith("Bearer ")) {
			token = token.slice(7);
		}

		if (!process.env.TOKEN_KEY) {
			throw new Error("TOKEN_KEY environment variable is missing");
		}

		const decoded = jwt.verify(token, process.env.TOKEN_KEY);
		req.user = decoded;

		const user = await User.findById(decoded.id);
		if (!user) {
			return res.status(200).send({ type: 'failure', message: 'User not found, please log in again.' });
		}

		if (!user.status) {
			return res.status(200).send({ type: 'failure', message: 'User is inactive, please contact support.', inactiveUser: true });
		}

		next();
	} catch (err) {
		console.error('Auth error:', err);
		if (err.name === 'TokenExpiredError') {
			return res.status(200).send({ type: 'failure', message: 'Token expired, please log in again.', tokenExpired: true });
		} else if (err.name === 'JsonWebTokenError') {
			return res.status(200).send({ type: 'failure', message: 'Invalid token, please log in again.', tokenExpired: true });
		} else {
			return res.status(500).send({ type: 'failure', message: 'Internal Server Error' });
		}
	}
};

module.exports = verifyToken;
