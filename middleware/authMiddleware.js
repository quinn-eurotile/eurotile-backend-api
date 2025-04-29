const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = async (req, res, next) => {

	let token = req.body?.token || req.query?.token || req.headers["x-access-token"] || req.headers.authorization;
	if (!token) {
		return res.status(200).send({ type: 'failure', message: "A authorization token is required for user authentication" });
	}
	try {
		//console.log('token',token);
		if (token.startsWith("Bearer ")) {
			token = token.slice(7);
		}
		const decoded = jwt.verify(token, process.env.TOKEN_KEY);
		//console.log('decoded',decoded);
		req.user = decoded;
		// Check if the user is active
		const user = await User.findById(decoded.id);
		if (!user) {
			return res.status(200).send({ type: 'failure', message: 'User not found, please log in again.' });
		}

		if (!user.status) {
			return res.status(200).send({ type: 'failure', message: 'User is inactive, please contact support.', inactiveUser: true });
		}
	} catch (err) {
		console.log('auth file err', err);
		if (err.name === 'TokenExpiredError') {
			return res.status(200).send({ type: 'failure', message: 'Token expired, please log in again.', tokenExpired: true });
		} else if (err.name === 'JsonWebTokenError') {
			return res.status(200).send({ type: 'failure', message: 'Invalid token, please log in again.', tokenExpired: true });
		} else {
			return res.status(500).send({ type: 'failure', message: 'Internal Server Error' });
		}
	}
	return next();
};

module.exports = verifyToken;