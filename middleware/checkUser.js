const creditService = require('../services/creditService');
const userService = require('../services/userService');

// Middleware function to check if the user's subscription is active
const checkUser = async (req, res, next) => {
    const userId = '660eb0acf51d375753664437'; // Assuming you have user details in req.user
    let userSelectedField = '';
    try {
        let userData = await userService.getUserById(userId, userSelectedField, '');
        const creditConfig = await creditService.getCredit(req);
        if (userData && creditConfig) {
            userData.allow_enrich_req = false; // Initialize allow_enrich_req property
        
            // Check if the user's credits meet the minimum threshold from creditConfig
            if (creditConfig.mimimum_threshold_credits <= userData.credits) {
                userData.allow_enrich_req = true;
            }
            // Set req.checkUser to userData
            req.checkUser = {userData,creditConfig};
            next();
        }else{
            if(!userData){
                return res.json({ type: 'failure', message: 'User not found' });
            }
            return res.json({ type: 'failure', message: 'Admin could not set the credit configuration' });
        }
    } catch (error) {
        return res.json({ type: 'failure', message: 'Internal server error from Middleware' });
    }
};

module.exports = checkUser;
